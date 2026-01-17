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
  // Create refs to access AG Grid API for data extraction
  const constraintsGridRef = useRef();
  const coursesGridRef = useRef();

  // State for constraints: semesters available, credits per semester, total credits needed
  const [constraintsGrid, setConstraintsGrid] = useState([
    { semesters: 4, credits_per_semester: 15, total_credits: 60 }
  ]);

  // State for courses: stores individual course information
  const [coursesGrid, setCoursesGrid] = useState([
    { course_id: "CS101", course_name: "Intro to CS", credits: 3, required: 1, semester_available: 1 },
    { course_id: "CS102", course_name: "Data Structures", credits: 4, required: 1, semester_available: 2 },
  ]);

  // State for output: stores the course results
  const [outputGrid, setOutputGrid] = useState([]);

  // Define column structure for constraints grid
  const constraintsGridColumns = [
    { headerName: "Total Semesters", field: "semesters", editable: true },
    { headerName: "Max Credits/Semester", field: "credits_per_semester", editable: true },
    { headerName: "Total Credits Needed", field: "total_credits", editable: true },
  ];

  // Define column structure for courses grid
  const coursesGridColumns = [
    { headerName: "Course ID", field: "course_id", editable: true },
    { headerName: "Course Name", field: "course_name", editable: true },
    { headerName: "Credits", field: "credits", editable: true },
    { headerName: "Required?", field: "required", editable: true, cellDataType: "boolean" },
    { headerName: "Available From Semester", field: "semester_available", editable: true },
  ];

  // Define column structure for output grid
  const outputGridColumns = [
    { field: "course_id", headerName: "Course ID" },
    { field: "course_name", headerName: "Course Name" },
    { field: "credits", headerName: "Credits" },
  ];

  // Collect all form data and prepare for submission to backend solver
  const handleSubmit = () => {
    // Extract constraints data
    const constraints = constraintsGridRef.current.api.getRowData();
    // Extract courses data
    const courses = coursesGridRef.current.api.getRowData();

    // Send data to backend solver
    fetch("http://localhost:8080/run_app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pid: "degree_planner",
        data: { constraints: constraints[0], courses },
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert("Error: " + data.error);
        } else {
          setOutputGrid(courses);
        }
      })
      .catch(error => alert("Request failed: " + error));
  };


  //Actual Website Stuff
  return (
    <div>
      <h2>Degree Planner</h2>
      
      <h3>Constraints</h3>
      <div style={{ height: "40vh" }}>
        <AgGridReact
          ref={constraintsGridRef}
          rowData={constraintsGrid}
          columnDefs={constraintsGridColumns}
          domLayout="fill"
        />
      </div>

      <h3>Courses</h3>
      <div style={{ height: "40vh" }}>
        <AgGridReact
          ref={coursesGridRef}
          rowData={coursesGrid}
          columnDefs={coursesGridColumns}
          domLayout="fill"
        />
      </div>

      <h3>Results</h3>
      <div style={{ height: "40vh" }}>
        <AgGridReact
          rowData={outputGrid}
          columnDefs={outputGridColumns}
          domLayout="fill"
        />
      </div>

      <SubmitButton onClick={handleSubmit} />
    </div>
  );
};

export default AppForm;
