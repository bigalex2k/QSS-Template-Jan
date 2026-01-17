"use client";
// Import React hooks for state management
import React, { useState, useRef } from "react";
// Import AG Grid React component for data table visualization
import { AgGridReact } from "ag-grid-react";
// Import AG Grid modules
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
// Import preset courses database
import { presetCourses } from "../presetCourses";
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
  const completedCoursesGridRef = useRef();
  const coursesGridRef = useRef();

  // State for constraints: semesters available, credits per semester, total credits needed
  const [constraintsGrid, setConstraintsGrid] = useState([
    { "semesters": 4, "credits_per_semester": 15, "total_credits": 60 }
  ]);

  // State for completed courses: courses already taken by the student
  const [completedCoursesGrid, setCompletedCoursesGrid] = useState([
    { "course_id": "CS180", "course_name": "Problem Solving and Object-Oriented Programming", "credits": 4, "semester": "1" },
    { "course_id": "MATH165", "course_name": "Plane Analytical Geometry and Calculus I", "credits": 4, "semester": "1" }
  ]);

  // State for courses: stores individual course information
  const [coursesGrid, setCoursesGrid] = useState([
    { "course_id": "CS180", "course_name": "Problem Solving and Object-Oriented Programming", "credits": 4, "required": 1, "semester_available": 1},
    { "course_id": "CS193", "course_name": "Tools", "credits": 1 , "required": 0, "semester_available": 2}
  ]);

  // State for output: stores the optimized course schedule
  const [outputGrid, setOutputGrid] = useState([]);

  // Define column structure for constraints grid
  const [constraintsGridColumns, setConstraintsGridColumns] = useState([
    { "headerName": "Total Semesters", "field": "semesters", "editable": true },
    { "headerName": "Max Credits/Semester", "field": "credits_per_semester", "editable": true },
    { "headerName": "Total Credits Needed", "field": "total_credits", "editable": true },
  ]);

  // Define column structure for completed courses grid
  const [completedCoursesGridColumns, setCompletedCoursesGridColumns] = useState([
    { "headerName": "Course ID", "field": "course_id", "editable": true },
    { "headerName": "Course Name", "field": "course_name", "editable": true },
    { "headerName": "Credits", "field": "credits", "editable": true },
    { "headerName": "Semester", "field": "semester", "editable": true },
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


  // Search panel state
  const [searchQuery, setSearchQuery] = useState("");

  // Filter preset courses based on search
  const filteredCourses = presetCourses.filter(course =>
    course.course_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.course_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add preset course to the grid
  const addPresetCourse = (presetCourse) => {
    const newCourse = {
      ...presetCourse,
      required: 0,
      semester_available: 1,
    };
    setCoursesGrid([...coursesGrid, newCourse]);
    setSearchQuery("");
  };

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Handler for right-click context menu
  const handleContextMenu = (e, courseId) => {
    e.preventDefault();
    setSelectedCourseId(courseId);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedCourseId(null);
  };

  // Handler for context menu options
  const handleMenuOption = (option) => {
    switch (option) {
      case "duplicate":
        const courseToDuplicate = coursesGrid.find(c => c.course_id === selectedCourseId);
        const newCourse = {
          ...courseToDuplicate,
          course_id: `CS${100 + coursesGrid.length}`,
        };
        setCoursesGrid([...coursesGrid, newCourse]);
        break;
      case "delete":
        setCoursesGrid(coursesGrid.filter(c => c.course_id !== selectedCourseId));
        break;
      default:
        break;
    }
    closeContextMenu();
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

  const getData = (constraintsGridRef, coursesGridRef) => {
    // Clear previous output and deselect all rows
    setOutputGrid([]);
    constraintsGridRef.current.api.forEachNode((node) => node.setSelected(false));
    coursesGridRef.current.api.forEachNode((node) => node.setSelected(false));
    // Extract all row data from both grids
    const rowDataConstraints = [];
    const rowDataCourses = [];
    constraintsGridRef.current.api.forEachNode((node) => rowDataConstraints.push(node.data));
    coursesGridRef.current.api.forEachNode((node) => rowDataCourses.push(node.data));

    return {"constraintsData": rowDataConstraints, "coursesData": rowDataCourses}
  }

  return (
    <div className="form-wrapper">
      <h1 style={{ textAlign: "center" }}>Degree Planner</h1>
      
      <h3 style={{ textAlign: "center", marginTop: "4vh", marginBottom: "2vh"}}>Constraints</h3>
      <div className="grid-container">
        <AgGridReact
          rowData={constraintsGrid}
          columnDefs={constraintsGridColumns}
          ref={constraintsGridRef}
          onCellValueChanged={setConstraintsGrid}
          columnSizingStrategy={sizeStrategy}
        />
      </div>

      <h3 style={{ textAlign: "center", marginTop: "4vh", marginBottom: "2vh"}}>Completed Courses</h3>
      <div className="grid-container">
        <AgGridReact
          rowData={completedCoursesGrid}
          columnDefs={completedCoursesGridColumns}
          ref={completedCoursesGridRef}
          onCellValueChanged={setCompletedCoursesGrid}
          columnSizingStrategy={sizeStrategy}
        />
      </div>

      <h3 style={{ textAlign: "center", marginTop: "4vh", marginBottom: "2vh"}}>Courses</h3>
      
      {/* Search Panel */}
      <div className="search-panel">
        <input
          type="text"
          placeholder="Search courses by ID or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <div className="search-results">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <div
                key={course.course_id}
                onClick={() => addPresetCourse(course)}
                className="search-result-item"
              >
                <div>
                  <strong>{course.course_id}</strong> - {course.course_name}
                </div>
                <div className="search-result-credits">{course.credits} credits</div>
              </div>
            ))
          ) : (
            <div className="search-no-results">No courses found</div>
          )}
        </div>
      </div>
      <div className="grid-container" onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}>
        <AgGridReact
          ref={coursesGridRef}
          rowData={coursesGrid}
          columnDefs={coursesGridColumns}
          columnSizingStrategy={sizeStrategy}
          onCellContextMenu={(params) => handleContextMenu(params.event, params.data.course_id)}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
          onMouseLeave={closeContextMenu}
        >
          <div
            onClick={() => handleMenuOption("duplicate")}
            className="context-menu-item context-menu-item-duplicate"
          >
            Duplicate
          </div>
          <div
            onClick={() => handleMenuOption("delete")}
            className="context-menu-item context-menu-item-delete"
          >
            Delete
          </div>
        </div>
      )}

      <h3 style={{ textAlign: "center", marginTop: "4vh", marginBottom: "2vh"}}>Optimized Schedule</h3>
      <div className="grid-container">
        <AgGridReact
          rowData={outputGrid}
          columnDefs={outputGridColumns}
          columnSizingStrategy={sizeStrategy}
        />
      </div>

      <div className="submit-button-wrapper">
        <SubmitButton 
          problem_id="quantum_degree"
          getData={() => getData(constraintsGridRef, coursesGridRef)}
          sendData={displayOutput}
        />
      </div>
    </div>
  );
};

export default AppForm;
