"""Compatibility entry point: render only the staff-notation PDFs for this edition."""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name("crop-wx-pep-pdfs.py")), run_name="__main__")
