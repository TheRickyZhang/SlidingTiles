# SlidingTiles Project Setup

This Django application provides a graphical interface for the N-sliding tiles puzzle, with options for manual play, greedy solve, and IDA* solve.

[![Sliding Tiles Image](https://github.com/TheRickyZhang/SlidingTiles/blob/main/static/SlidingTiles.png?raw=true)](https://github.com/TheRickyZhang/SlidingTiles)

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Python 3.8 or higher
- git (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TheRickyZhang/SlidingTiles
   ```

2. **Create and activate a virtual environment**
   On Unix or MacOS:
   ```bash
      python -m venv env
      source env/bin/activate
   ```
   
   On Windows:
   ```bash
     python -m venv env
     env\Scripts\activate
   ```

3. **Install all dependencies**
   ```bash
   pip install -r requirements.txt


## Running the Project
Navigate to the project directory and perform the following steps, if necessary:
1. Apply migrations (if models have been changed)
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
2. Collect static files (if any changes have been made to static assets)
    ```bash
    python manage.py collectstatic
    ```
   You will be prompted to confirm the operation. Type 'yes' to proceed.
3. Start the development server
   ```bash
   python manage.py runserver
   ```
Access the web application by clicking on the link provided in the terminal or navigate to http://127.0.0.1:8000/ in your web browser.


## Contributing
This project is licensed under the MIT License
