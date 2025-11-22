"""
Setup script para instalar DOCommunication Backend como paquete
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="docommunication-backend",
    version="1.0.0",
    author="DOCommunication Team",
    description="Backend para sistema de comunicación gestual en UCI",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/docommunication",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Healthcare Industry",
        "Topic :: Scientific/Engineering :: Medical Science Apps.",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.10",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "docommunication=main:main",
        ],
    },
)
