import os
import sys

# Add root project folder to sys.path so imports like 'scheduler' work in Vercel Serverless
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app
