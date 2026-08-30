# SPDX-License-Identifier: Apache-2.0
cmake_minimum_required(VERSION 3.8)
project(bpi_msgs)

find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)

file(GLOB BPI_MSG_FILES RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}" "msg/*.msg")
rosidl_generate_interfaces(${PROJECT_NAME} ${BPI_MSG_FILES})

ament_package()
