// Dashboard Consolidador - Complete JavaScript File
// This file implements a dashboard for consolidating Excel files.
// Assumes SheetJS (XLSX) library is included via CDN or script tag.

// Global variables to store state
let files = []; // Array to hold uploaded files
let consolidatedData = {}; // Object to hold consolidated data

// Function to handle drag & drop on the drop-zone
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleDrop(event) {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    addFiles(droppedFiles);
}

function addFiles(newFiles) {
    files.push(...newFiles);
    renderFileList();
}

// Function to read Excel files using SheetJS
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// Function to extract month from file name (supports: 2026-01, jan-2026, Janeiro, 01_2026)
function extractMonth(fileName) {
    const patterns = [
        /(\d{4})-(\d{2})/, // 2026-01
        /(\w{3})-(\d{4})/, // jan-2026
        /(\w+)/, // Janeiro
        /(\d{2})_(\d{4})/ // 01_2026
    ];
    const monthNames = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
        'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06',
        'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    for (let pattern of patterns) {
        const match = fileName.match(pattern);
        if (match) {
            if (match[2]) {
                return match[2].length === 4 ? match[1] + '-' + match[2] : match[2] + '-' + match[1];
            } else {
                const month = monthNames[match[1].toLowerCase()];
                if (month) return '2026-' + month; // Assuming year 2026 if not specified
            }
        }
    }
    return 'Unknown';
}

// Function to consolidate data (sum values, group by category)
function consolidateData(dataArray) {
    const consolidated = {};
    dataArray.forEach(data => {
        data.forEach(row => {
            const category = row['Category'] || 'Unknown';
            const value = parseFloat(row['Value']) || 0;
            if (!consolidated[category]) consolidated[category] = 0;
            consolidated[category] += value;
        });
    });
    return consolidated;
}

// Function to render list of files
function renderFileList() {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    files.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = `${file.name} (Month: ${extractMonth(file.name)})`;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => {
            files.splice(index, 1);
            renderFileList();
        };
        li.appendChild(removeBtn);
        fileList.appendChild(li);
    });
}

// Function to process consolidation (read files, consolidate, show preview)
async function processConsolidation() {
    const dataPromises = files.map(file => readExcelFile(file));
    try {
        const dataArray = await Promise.all(dataPromises);
        consolidatedData = consolidateData(dataArray);
        showPreview(consolidatedData);
    } catch (error) {
        alert('Error processing files: ' + error.message);
    }
}

// Function to show preview of consolidated data in HTML table
function showPreview(data) {
    const preview = document.getElementById('preview');
    preview.innerHTML = '<h3>Consolidated Data Preview</h3>';
    const table = document.createElement('table');
    table.innerHTML = '<tr><th>Category</th><th>Total Value</th></tr>';
    for (const [category, value] of Object.entries(data)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${category}</td><td>${value}</td>`;
        table.appendChild(row);
    }
    preview.appendChild(table);
}

// Function to simulate backup structure
function simulateBackup() {
    // This is a mock function; in real implementation, save to server or local storage
    console.log('Backup simulated:', consolidatedData);
    alert('Backup simulated successfully!');
}

// Function to download consolidated Excel using SheetJS
function downloadConsolidatedExcel() {
    const ws = XLSX.utils.json_to_sheet(Object.entries(consolidatedData).map(([k, v]) => ({ Category: k, Value: v })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Consolidated');
    XLSX.writeFile(wb, 'consolidated_data.xlsx');
}

// Function to load mocked examples (3 example files)
function loadMockExamples() {
    // Mock data for 3 files
    const mockFiles = [
        { name: '2026-01.xlsx', data: [{ Category: 'A', Value: 100 }, { Category: 'B', Value: 200 }] },
        { name: 'jan-2026.xlsx', data: [{ Category: 'A', Value: 150 }, { Category: 'C', Value: 250 }] },
        { name: 'Janeiro.xlsx', data: [{ Category: 'B', Value: 300 }, { Category: 'C', Value: 400 }] }
    ];
    files = mockFiles.map(mock => ({ name: mock.name, data: mock.data }));
    renderFileList();
    // Simulate consolidation
    consolidatedData = consolidateData(mockFiles.map(f => f.data));
    showPreview(consolidatedData);
}

// Function to reset the application
function resetApp() {
    files = [];
    consolidatedData = {};
    renderFileList();
    document.getElementById('preview').innerHTML = '';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('process-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const loadExampleBtn = document.getElementById('load-example-btn');

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', (e) => addFiles(Array.from(e.target.files)));
    processBtn.addEventListener('click', processConsolidation);
    downloadBtn.addEventListener('click', downloadConsolidatedExcel);
    resetBtn.addEventListener('click', resetApp);
    loadExampleBtn.addEventListener('click', loadMockExamples);

    // Initialization
    renderFileList();
});