import os
import sys

def create_ppt_trigger():
    try:
        sys.path.append('f:\\Petpooja')
        import generate_ppt
        return "Success!"
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    print(create_ppt_trigger())
