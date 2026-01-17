"use client";
// Import React hooks for state management
import React, { useState, useRef } from "react";
// Import AG Grid React component for data table visualization
import { AgGridReact } from "ag-grid-react";
// Import AG Grid modules
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
// Import component styles
import "../quantum_degree.css";
// Import the submit button component
import SubmitButton from "@/app/components/app/submit/SubmitButton";

// Register all AG Grid community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Degree Planner form component for optimizing course schedules
const AppForm = () => {
  // Grid height setting
  const grid_height_vh = 40;

  // Create refs to access AG Grid API for data extraction
  const constraintsGridRef = useRef();
  const coursesGridRef = useRef();

  // State for constraints: semesters available, credits per semester, total credits needed
  const [constraintsGrid, setConstraintsGrid] = useState([
    { "semesters": 4, "credits_per_semester": 15, "total_credits": 60 }
  ]);

  // State for courses: stores individual course information
  const [coursesGrid, setCoursesGrid] = useState([
    { "course_id": "CS101", "course_name": "Intro to CS", "credits": 3, "required": 1, "semester_available": 1 },
    { "course_id": "CS102", "course_name": "Data Structures", "credits": 4, "required": 1, "semester_available": 2 },
  ]);

  // State for output: stores the optimized course schedule
  const [outputGrid, setOutputGrid] = useState([]);

  // Define column structure for constraints grid
  const [constraintsGridColumns, setConstraintsGridColumns] = useState([
    { "headerName": "Total Semesters", "field": "semesters", "editable": true },
    { "headerName": "Max Credits/Semester", "field": "credits_per_semester", "editable": true },
    { "headerName": "Total Credits Needed", "field": "total_credits", "editable": true },
  ]);

  // Define column structure for courses grid
  const [coursesGridColumns, setCoursesGridColumns] = useState([
    { "headerName": "Course ID", "field": "course_id", "editable": true },
    { "headerName": "Course Name", "field": "course_name", "editable": true },
    { "headerName": "Credits", "field": "credits", "editable": true },
    { "headerName": "Required?", "field": "required", "editable": true, "cellDataType": "boolean" },
    { "headerName": "Available From Semester", "field": "semester_available", "editable": true },
  ]);

  // Define column structure for output grid
  const [outputGridColumns, setOutputGridColumns] = useState([
    { "field": "course_id", "headerName": "Course ID" },
    { "field": "course_name", "headerName": "Course Name" },
    { "field": "credits", "headerName": "Credits" },
    {
      "headerName": "Scheduled For Semester",
      "children": [
        { "field": "semester_1", "headerName": "Sem 1" },
        { "field": "semester_2", "headerName": "Sem 2" },
        { "field": "semester_3", "headerName": "Sem 3" },
        { "field": "semester_4", "headerName": "Sem 4" },
      ],
    }
  ]);

  // Handler to add a new course row
  const addCourse = () => {
    const newCourse = {
      course_id: `CS${100 + coursesGrid.length}`,
      course_name: "New Course",
      credits: 3,
      required: 0,
      semester_available: 1,
    };
    setCoursesGrid([...coursesGrid, newCourse]);
  };

  // Handler to remove the last course row
  const removeCourse = () => {
    if (coursesGrid.length > 0) {
      setCoursesGrid(coursesGrid.slice(0, -1));
    }
  };

  // AG Grid sizing strategy
  const sizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100
  };

  // Process the solver results and format for display
  const displayOutput = (data) => {
    // Format the solution data for the output grid
    const outputData = coursesGrid.map(course => ({
      course_id: course.course_id,
      course_name: course.course_name,
      credits: course.credits,
      semester_1: data[`${course.course_id}_1`] ?? 0,
      semester_2: data[`${course.course_id}_2`] ?? 0,
      semester_3: data[`${course.course_id}_3`] ?? 0,
      semester_4: data[`${course.course_id}_4`] ?? 0,
    }));
    setOutputGrid(outputData);
  };

  // Collect all form data and prepare for submission to backend solver
  const handleSubmit = () => {
    // Extract constraints data
    const constraints = constraintsGridRef.current.api.getRowData();
    
    // Extract courses data
    const courses = coursesGridRef.current.api.getRowData();

    // Prepare data structure for backend
    const formData = {
      constraints: constraints[0],
      courses: courses,
    };

    // Send data to backend solver
    fetch("http://localhost:8080/run_app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pid: "degree_planner",
        data: formData,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert("Error: " + data.error);
        } else {
          displayOutput(data);
        }
      })
      .catch(error => {
        alert("Request failed: " + error);
      });
  };

  return (
    <div>
      <h2>Degree Planner</h2>
      
      <h3>Constraints</h3>
      <div style={{ height: `${grid_height_vh}vh` }}>
        <AgGridReact
          ref={constraintsGridRef}
          rowData={constraintsGrid}
          columnDefs={constraintsGridColumns}
          domLayout="fill"
          columnSizingStrategy={sizeStrategy}
        />
      </div>

      <h3>Courses</h3>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={addCourse} style={{ marginRight: "10px" }}>Add Course</button>
        <button onClick={removeCourse}>Remove Course</button>
      </div>
      <div style={{ height: `${grid_height_vh}vh` }}>
        <AgGridReact
          ref={coursesGridRef}
          rowData={coursesGrid}
          columnDefs={coursesGridColumns}
          domLayout="fill"
          columnSizingStrategy={sizeStrategy}
        />
      </div>

      <h3>Optimized Schedule</h3>
      <div style={{ height: `${grid_height_vh}vh` }}>
        <AgGridReact
          rowData={outputGrid}
          columnDefs={outputGridColumns}
          domLayout="fill"
          columnSizingStrategy={sizeStrategy}
        />
      </div>

      <SubmitButton onClick={handleSubmit} />
    </div>
  );
};

export default AppForm;
