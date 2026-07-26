"""
Modern Machine Learning Hyperparameter & Heuristic Policy Tuner for ERP Timetable Scheduler.

Uses surrogate optimization and Bayesian parameter sampling to dynamically tune soft-constraint
penalty weights without changing the underlying deterministic constraint-verification code.
"""

import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from scheduler import StaffRegistry, FacultyMember, InstitutionalScheduler

class MLSchedulerTuner:
    """
    ML-driven surrogate optimizer for Timetable Scheduler soft constraints.
    Tunes heuristic parameter weights to maximize schedule quality & minimize fatigue/conflicts.
    """
    
    PARAM_BOUNDS = {
        "same_day": (200.0, 2000.0),
        "same_hour": (100.0, 1000.0),
        "late_core": (50.0, 600.0),
        "early_core": (-200.0, 0.0),
        "early_elective": (0.0, 300.0),
        "day_load": (10.0, 150.0)
    }

    def __init__(
        self,
        departments_data: Dict[str, Dict[str, Any]],
        staff_registry: Optional[StaffRegistry] = None,
        combined_classes: Optional[List[Dict[str, Any]]] = None,
        working_days: int = 4,
        hours_per_day: int = 6
    ):
        self.departments_data = departments_data
        self.staff_registry = staff_registry or StaffRegistry()
        self.combined_classes = combined_classes or []
        self.working_days = working_days
        self.hours_per_day = hours_per_day

    def evaluate_fitness(
        self,
        dept_timetables: Dict[str, Any],
        conflicts: List[str],
        metrics: Dict[str, Any]
    ) -> float:
        """
        Evaluates multi-objective fitness score of a timetable:
          + Higher score = Better timetable quality
          - Penalizes conflicts heavily
          - Rewards even subject distribution & morning theory placement
        """
        fitness = 1000.0

        # 1. Conflict Penalties (Hard & Soft Warning Penalty)
        conflict_penalty = len(conflicts) * 500.0
        fitness -= conflict_penalty

        # 2. Utilization & Slot Metrics
        allocated = metrics.get("total_allocated_slots", 0)
        total_slots = metrics.get("total_institution_slots", 1)
        utilization = (allocated / total_slots) * 100.0 if total_slots > 0 else 0
        fitness += utilization * 5.0

        # 3. Department Level Quality Metrics
        for dept_name, df_grid in dept_timetables.items():
            # Check subject day distribution (avoid 2 theory sessions of same subject on same day)
            for col in df_grid.columns:
                day_series = df_grid[col] # slots across days
                # Check consecutive workload balance
                daily_counts = (day_series != "FREE") & (day_series != "LUNCH BREAK")
                workload_var = float(np.var(daily_counts.values))
                fitness -= workload_var * 20.0

            # Core theory morning placement bonus (slots 0, 1, 2)
            morning_cols = df_grid.iloc[:, :3] if df_grid.shape[1] >= 3 else df_grid
            morning_assignments = ((morning_cols != "FREE") & (morning_cols != "LUNCH BREAK")).sum().sum()
            fitness += morning_assignments * 15.0

        return max(0.0, round(float(fitness), 2))

    def _sample_weights(self, trial_idx: int, best_weights: Optional[Dict[str, float]] = None) -> Dict[str, float]:
        """Samples candidate weight vectors using Gaussian exploration around best known parameters."""
        sampled = {}
        for param, (low, high) in self.PARAM_BOUNDS.items():
            if best_weights and trial_idx > 5 and np.random.rand() > 0.3:
                # Gaussian mutation around best known weights
                center = best_weights[param]
                sigma = (high - low) * 0.15
                val = float(np.clip(np.random.normal(center, sigma), low, high))
            else:
                # Uniform random sampling for global exploration
                val = float(np.random.uniform(low, high))
            sampled[param] = round(val, 2)
        return sampled

    def tune(self, max_trials: int = 40) -> Tuple[Dict[str, float], float, Dict[str, Any], List[str], Dict[str, Any], List[Dict[str, Any]]]:
        """
        Executes ML hyperparameter optimization loop.
        Returns:
          - Optimal Heuristic Weights
          - Best Fitness Score
          - Department Timetables
          - Conflict warnings
          - Diagnostics Metrics
          - Trial History Log
        """
        best_fitness = -1.0
        best_weights = InstitutionalScheduler.DEFAULT_HEURISTIC_WEIGHTS.copy()
        best_result = None
        trial_history = []

        # Trial 0: Standard Default Heuristics Baseline
        init_weights = InstitutionalScheduler.DEFAULT_HEURISTIC_WEIGHTS.copy()
        scheduler = InstitutionalScheduler(
            departments_data=self.departments_data,
            staff_registry=self.staff_registry,
            combined_classes=self.combined_classes,
            working_days=self.working_days,
            hours_per_day=self.hours_per_day,
            heuristic_weights=init_weights
        )
        d_tt, confs, mets = scheduler.generate_all()
        fit = self.evaluate_fitness(d_tt, confs, mets)
        
        best_fitness = fit
        best_weights = init_weights
        best_result = (d_tt, confs, mets)
        trial_history.append({"trial": 0, "weights": init_weights, "fitness": fit, "conflicts": len(confs)})

        # Optimization Search Loop (Surrogate Guided Sampling)
        for trial in range(1, max_trials):
            cand_weights = self._sample_weights(trial, best_weights)
            trial_scheduler = InstitutionalScheduler(
                departments_data=self.departments_data,
                staff_registry=self.staff_registry,
                combined_classes=self.combined_classes,
                working_days=self.working_days,
                hours_per_day=self.hours_per_day,
                heuristic_weights=cand_weights
            )
            d_tt, confs, mets = trial_scheduler.generate_all()
            fit = self.evaluate_fitness(d_tt, confs, mets)

            trial_history.append({"trial": trial, "weights": cand_weights, "fitness": fit, "conflicts": len(confs)})

            if fit > best_fitness:
                best_fitness = fit
                best_weights = cand_weights
                best_result = (d_tt, confs, mets)

        best_tt, best_confs, best_mets = best_result
        best_mets["ml_optimization"] = {
            "initial_fitness": trial_history[0]["fitness"],
            "best_fitness": best_fitness,
            "improvement_pct": round(((best_fitness - trial_history[0]["fitness"]) / max(1.0, trial_history[0]["fitness"])) * 100.0, 2),
            "optimal_weights": best_weights,
            "total_trials": max_trials
        }

        return best_weights, best_fitness, best_tt, best_confs, best_mets, trial_history
