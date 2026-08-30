# SPDX-License-Identifier: Apache-2.0
from setuptools import setup

package_name = 'bpi_interlock'

setup(
    name=package_name,
    version='0.2.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Ido Yahalomi',
    maintainer_email='ido@jacob-ai.com',
    description='The BPI-S interlock as a ROS 2 node.',
    license='Apache-2.0',
    entry_points={
        'console_scripts': ['interlock = bpi_interlock.interlock_node:main'],
    },
)
