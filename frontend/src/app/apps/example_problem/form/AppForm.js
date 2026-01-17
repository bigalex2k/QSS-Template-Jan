"use client";
// Import React hooks for state management and direct DOM element access
import React, { useState, useRef } from "react";
// Import AG Grid React component for data table visualization
import { AgGridReact } from "ag-grid-react";
// Import AG Grid modules and registry for initializing grid features
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
// Import component styles
import "../problem_1.css";
// Import the submit button component that triggers the solver
import SubmitButton from "@/app/components/app/submit/SubmitButton";

// Register all AG Grid community modules to enable grid functionality
ModuleRegistry.registerModules([AllCommunityModule]);

// Main form component for the supply chain optimization problem
const AppForm = () => {
  // Set the height of supplier and output grids to 40% of viewport height
  const grid_height_vh = 40;

  // Create refs to directly access AG Grid API for data extraction
  const companyGridRef = useRef();     // Reference to company information grid
  const supplierGridRef = useRef();    // Reference to suppliers grid
  const supplierSizeRef = useRef();    // Reference to store supplier metadata

  // State for company grid: stores company data (number of suppliers, stock needs, product units)
  const [companyGrid, setCompanyGrid] = useState([
    { "suppliers": 0, "stock_need": 0, "units": 0 }
  ]);

  // State for supplier grid: stores individual supplier information
  const [supplierGrid, setSupplierGrid] = useState([]);
  // State for output grid: stores the optimization solution from the backend solver
  const [outputGrid, setOutputGrid] = useState([]);
  // Define column structure for company information grid (all editable)
  const [companyGridColumns, setCompanyGridColumns] = useState([
    { "headerName": '# Suppliers', "field": 'suppliers', "editable": true },
    { "headerName": 'Stock need in (days)', "field": 'stock_need', "editable": true },
    { "headerName": 'Units of Product', "field": 'units', "editable": true },
  ]);
  // Define column structure for suppliers grid (supplier name is read-only, others editable)
  const [supplierGridColumns, setSupplierGridColumns] = useState([
    { "headerName": 'Supplier', "field": 'supplier' },
    { "headerName": 'Bulk Units', "field": 'bulk_units', "editable": true },
    { "headerName": 'Total Cost', "field": 'total_cost', "editable": true },
    { "headerName": 'Lead Time', "field": 'lead_time', "editable": true },
  ]);
  // Define column structure for output/solution grid (read-only results from solver)
  // Shows supplier names and their selected orders across 3 order periods
  const [outputGridColumns, setOutputGridColumns] = useState([
    { "field": "supplier", "headerName": "Supplier Constraints" },
    {
      "headerName": "Order Selected",
      "children": [
        { "field": "order_1", "headerName": " " },
        { "field": "order_2", "headerName": " " },
        { "field": "order_3", "headerName": " " },
      ],
    }
  ]);

  // Handler triggered when company grid data changes (specifically when supplier count is updated)
  // Dynamically creates or removes supplier rows based on the number entered
  const handleCompanyGridChanged = (params) => {
    // Extract the number of suppliers from the updated company row
    const supplierCount = params['data'][companyGridColumns[0]['field']];
    // Check if supplier count is valid and different from current supplier rows
    if (supplierCount != null && supplierCount > -1) {
      // If we need more suppliers, create new rows with default values
      if (supplierGrid.length < supplierCount) {
        const newSupplierGrid = Array.from(supplierGrid).concat(Array.from({ length: (supplierCount - supplierGrid.length) }, (_, index) => ({
          supplier: `${supplierGridColumns[0]['headerName']} ${index + 1 + supplierGrid.length}`,
          bulk_units: 0,
          total_cost: 0,
          lead_time: 0,
        })));
        setSupplierGrid(newSupplierGrid);
      } else if (supplierGrid.length > supplierCount) {
        // If we have too many suppliers, remove excess rows
        const newSupplierGrid = Array.from(supplierGrid).slice(0, supplierCount);
        setSupplierGrid(newSupplierGrid);
      }
    }
  };

  // AG Grid sizing strategy: fit columns to grid width with minimum column width of 100px
  const sizeStrategy = {
    type: "fitGridWidth",
    defaultMinWidth: 100
  };

  // Process the solver results and format them for display in the output grid
  const displayOutput = (data) => {
    // Create a 2D array: rows = suppliers, columns = order periods
    const res = Array.from({ length: supplierSizeRef.size }, () => Array(supplierSizeRef.o).fill(0));
    // Reconstruct the 2D array from flattened solution data (keyed as "supplier_order")
    for (let o = 0; o < supplierSizeRef.o; o++) {
        for (let s = 0; s < supplierSizeRef.size; s++) {
            const key = `${s}_${o}`;
            res[s][o] = data[key] ?? 0;  // Default to 0 if key doesn't exist
        }
    }
    // Format results as objects with supplier name and order quantities for display
    const output = Array.from({ length: supplierSizeRef.size }, (_, i) => ({
        supplier: supplierSizeRef.idx[i],
        order_1: res[i][0] ?? 0,
        order_2: res[i][1] ?? 0,
        order_3: res[i][2] ?? 0,
    }));
    // Update the output grid state to display results
    setOutputGrid(output);
  };

  // Extract data from both grids, perform calculations, and prepare for backend solver
  const getData = (companyGridRef, supplierGridRef) => {
    // Clear previous output and deselect all rows
    setOutputGrid([]);
    companyGridRef.current.api.forEachNode((node) => node.setSelected(false));
    supplierGridRef.current.api.forEachNode((node) => node.setSelected(false));
    // Extract all row data from both grids
    const rowDataCompany = [];
    const rowDataSupplier = [];
    companyGridRef.current.api.forEachNode((node) => rowDataCompany.push(node.data));
    supplierGridRef.current.api.forEachNode((node) => rowDataSupplier.push(node.data));
    // Store supplier count and extract demand and lead time data
    supplierSizeRef.size = rowDataCompany[0]["suppliers"];  // Number of suppliers
    const D = rowDataCompany[0]["stock_need"];              // Demand in days
    supplierSizeRef.idx = rowDataSupplier.map(s => s["supplier"]);  // Supplier names
    const leadTimes = rowDataSupplier.map(s => s.lead_time);        // Lead times for each supplier
    // Calculate number of order periods based on minimum lead time
    let o_temp = 0;
    const minLeadTime = Math.min(...leadTimes);
    if (minLeadTime !== 0) {
      // Number of orders = demand days / minimum lead time (rounded down)
      o_temp = Math.floor(D / minLeadTime);
    }
    supplierSizeRef.o = o_temp;  // Store calculated order periods
    return {"companyData": rowDataCompany, "supplierData": rowDataSupplier}
  };

  // Configure grid behavior: stop editing when user clicks outside a cell
  const gridOptions = {
    stopEditingWhenCellsLoseFocus: true,
  };

  // Render the form with three sections: company info, suppliers, and solution
  return (
    <div>
      <div style={{ padding: "20px" }}>
        {/* Company Information Section */}
        <div style={{ marginBottom: "10px" }}>
          <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Company Information</h2>
          <div style={{ margin: "0 auto", height: `10.55vh`, width: "50%" }}>
            <AgGridReact
              rowData={companyGrid}
              columnDefs={companyGridColumns}
              autoSizeStrategy={sizeStrategy}
              onCellValueChanged={handleCompanyGridChanged}
              ref={companyGridRef}
              gridOptions={gridOptions}
            />
          </div>
        </div>
        {/* Suppliers Section */}
        <div style={{ marginBottom: "10px" }}>
          <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Suppliers</h2>
          <div style={{ margin: "0 auto", height: `${grid_height_vh}vh`, width: "50%" }}>
            <AgGridReact
              rowData={supplierGrid}
              columnDefs={supplierGridColumns}
              autoSizeStrategy={sizeStrategy}
              ref={supplierGridRef}
              gridOptions={gridOptions}
            />
          </div>
        </div>
        {/* Solution/Output Section */}
        <div>
          <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Solution</h2>
          <div style={{ margin: "0 auto", height: `${grid_height_vh}vh`, width: "50%" }}>
            <AgGridReact
              rowData={outputGrid}
              columnDefs={outputGridColumns}
              autoSizeStrategy={sizeStrategy}
              gridOptions={gridOptions}
            />
          </div>
        </div>
        {/* Submit Button: triggers getData and passes results to displayOutput */}
        <SubmitButton 
          problem_id="example_problem" 
          getData={() => getData(companyGridRef, supplierGridRef)} 
          sendData={displayOutput} 
        />
        </div>
    </div>
  );
};

export default AppForm;