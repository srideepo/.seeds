const svg = document.getElementById('svg');
const container = document.getElementById('container');
const addBtn = document.getElementById('addBtn');
const undoBtn = document.getElementById('undoBtn');
const arrangeBtn = document.getElementById('arrangeBtn');
const drawPathBtn = document.getElementById('drawPathBtn');
const exportBtn = document.getElementById('exportBtn');

const tooltip = document.getElementById('tooltip');
let blockCount = 0;
let blocks = [];
let draggingRow = null;
let tempPath = null;
let connections = [];

function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, dragging = false;
    el.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TD') return; // Don't drag block if clicking inside a row
        dragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        el.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (dragging) {
            el.style.left = (e.clientX - offsetX) + 'px';
            el.style.top = (e.clientY - offsetY) + 'px';
            updateAllConnections();
        }
    });

    document.addEventListener('mouseup', () => {
        dragging = false;
        el.style.cursor = 'grab';
    });
}

function rowEdge(row, side = 'right') {
    const rect = row.getBoundingClientRect();
    const x = side === 'left' ? rect.left : rect.right;
    const y = rect.top + rect.height / 2;
    if (side == 'bottom') {
        const x = rect.left + rect.right/2;
        const y = rect.bottom;   
        return { x, y }; 
    }
    return { x, y };
}

function createPath(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

function startRowDrag(row, side) {
    draggingRow = row;
    tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tempPath.setAttribute("stroke", "blue");
    tempPath.setAttribute("stroke-width", "2");
    tempPath.setAttribute("fill", "none");
    tempPath.setAttribute("marker-end", "url(#arrow)"); // Apply arrow marker to path
    svg.appendChild(tempPath);
    // Set starting edge (left or right)
    const from = rowEdge(row, side);
    tempPath.setAttribute("d", `M ${from.x},${from.y} C ${from.x},${from.y} ${from.x},${from.y} ${from.x},${from.y}`);
}

function endRowDrag(targetRow) {
    console.log(draggingRow, targetRow);
    if (
        draggingRow && targetRow &&
        draggingRow !== targetRow &&
        !draggingRow.closest('.block').isSameNode(targetRow.closest('.block'))
    ) {
        const from = rowEdge(draggingRow, 'right');
        const to = rowEdge(targetRow, 'left');
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        path.setAttribute("marker-end", "url(#arrow)"); // Apply arrow marker to path
        path.setAttribute("d", createPath(from.x, from.y, to.x, to.y));
        svg.appendChild(path);
        connections.push({ from: draggingRow, to: targetRow, path });
    }
    if (tempPath) {
        svg.removeChild(tempPath);
        tempPath = null;
    }
    draggingRow = null;
}

function drawConnections(){
    const columns = erSchema.flatMap((j) => j.columns.filter((item)=>(item.hasOwnProperty('related_to') ? item['name']=j.name+'.'+item['name'] : null)));
    columns.forEach(cols=>{
        startRow = document.querySelector(`#${cols.name.replace('.', '\\.')}`); //'#fact_transactions\\.transaction_id');
        endRow = document.querySelector(`#${cols.related_to.replace('.', '\\.')}`); //'#dim_transactions\\.transaction_id');
        drawOneConnection(startRow, endRow);
    });
}

function drawOneConnection(startRow, endRow) {
    if (
        startRow && endRow &&
        startRow !== endRow
      ) {
        const from = rowEdge(startRow, 'right');
        const to = rowEdge(endRow, 'left');
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("id", `${endRow.id}`);
        path.setAttribute("class", "icon");
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        path.setAttribute("marker-end", "url(#arrow)"); // Apply arrow marker to path
        path.setAttribute("d", createPath(from.x, from.y, to.x, to.y));
        svg.appendChild(path);
        connections.push({ from: startRow, to: endRow, path});
    }
}

function updateAllConnections() {
    connections.forEach(conn => {
        const from = rowEdge(conn.from, 'right');
        const to = rowEdge(conn.to, 'left');
        conn.path.setAttribute("d", createPath(from.x, from.y, to.x, to.y));
    });
}

function showTooltip(row) {
    const rowData = Array.from(row.cells).map(cell => {
        return `${cell.previousElementSibling ? cell.previousElementSibling.textContent : ''}: ${cell.textContent}`;
    }).join('<br>');
    tooltip.innerHTML = rowData;
    tooltip.style.display = 'block';
    const rect = row.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

function setupRowDragging(block) {
    const rows = block.querySelectorAll('tr.connectable');
    rows.forEach(row => {
        row.addEventListener('mousedown', e => {
            e.stopPropagation(); // prevent block dragging
            const side = e.clientX < row.getBoundingClientRect().left + row.offsetWidth / 2 ? 'left' : 'right';
            startRowDrag(row, side);
        });
        row.addEventListener('mouseup', e => {
            e.stopPropagation();
            endRowDrag(row);
        });
        row.addEventListener('mouseover', () => showTooltip(row));
        row.addEventListener('mouseout', hideTooltip);
    });
}

document.addEventListener('mousemove', e => {
    if (draggingRow && tempPath) {
        const from = rowEdge(draggingRow, 'right');
        const to = { x: e.clientX, y: e.clientY };
        // Snapping logic for left and right approach
        if (e.clientX < from.x) {
            to.x = rowEdge(draggingRow, 'left').x;
        } else {
            to.x = rowEdge(draggingRow, 'right').x;
        }
        tempPath.setAttribute("d", createPath(from.x, from.y, to.x, to.y));
    }
});

document.addEventListener('mouseup', () => {
    if (draggingRow) {
        endRowDrag(null);
    }
});

function tagFn(strTemplate, ...strExpressions){
    //console.log(strTemplate, ":>", strExpressions);
    return strExpressions.reduce((acc, exp, idx)=>{
        return acc + exp + strTemplate[idx + 1];
    }, strTemplate[0]);
}

function createElementFromText(_htmlText){
    const _parser = new DOMParser()
    var _newElement = _parser.parseFromString(_htmlText.toString(), "text/html");
    return _newElement.body.firstChild;
}

function createBlock() {
    blockCount++;
    const _blockTemplate = document.querySelector("#entityblock");
    const _blockTemplateClone = _blockTemplate.content.cloneNode(true);
    const _tRow = _blockTemplateClone.querySelector('tr').cloneNode(true);
    const _tRowLiteral = _tRow.outerHTML;

    //circumvent unexpected behavior - _templateTableClone.outerHTML yields undefined hence getting from DOM
    var _blockLiteral = document.querySelector("template").innerHTML;

    erSchema.forEach(erTable => {
        //var name has to be `data` and shape has to be consistent with it's reference in the html template
        var data = {"tablename":erTable.name};
        const _blockNewElement = createElementFromText(eval('tagFn`' + _blockLiteral + '`'));
        _blockNewElement.addEventListener('dblclick', addRow);
        var _blockTBody = _blockNewElement.querySelector('tbody');
        data.items = erTable.columns;
        var _blockTBodyClone = addBlockRows(data, _blockTBody, _tRowLiteral);
        _blockTBody.innerHTML = _blockTBodyClone.innerHTML;
        container.appendChild(_blockNewElement);
        blocks.push(_blockNewElement);
        makeDraggable(_blockNewElement);
        //setupRowDragging(_blockNewElement);
    });
    return
}

function addBlockRows(_rowData, _rowContainer, _rowLiteral){
    var _rowCollectionLiteral = '';
    _rowData.items.forEach(item => {
        var data = item;
        data.tablename = _rowData.tablename;
        var _blockNewRow = eval('tagFn`' + _rowLiteral + '`');
        _rowCollectionLiteral += _blockNewRow;
    });
    var _blockNewElement = createElementFromText("<table>" + _rowCollectionLiteral + "</table>");
    return _blockNewElement;
}

function addRow(e) {
    e.srcElement.parentElement.insertAdjacentHTML("beforeend", `<tr class="connectable"><td class="key" contenteditable=true>Col1</td><td contenteditable=true>Col2</td></tr>`);
    console.log(e);
}

function undoLastConnection() {
    const lastConnection = connections.pop();
    if (lastConnection && lastConnection.path) {
        svg.removeChild(lastConnection.path);
    }
}

function rearrange(){
    blocks.forEach(block=>{
        const divElement = document.getElementById(block.id);
        const coords = erCoordinates.find(item => item.name === block.id.replace('block_', ''));
        divElement.style.position = 'absolute';
        divElement.style.left = `${coords.loc.x}`;
        divElement.style.top = `${coords.loc.y}`;
        //divElement.style.left = `${coords.loc.x}px`;
        //divElement.style.top = `${coords.loc.y}px`;
        //divElement.style.translate = `${coords.loc.x}px ${coords.loc.y}px`;
    });
}

function exportSpecification() {
    _export_spec = []
    blocks.forEach(block=>{
        const divElement = document.getElementById(block.id);
        _export_spec.push({name:block.id.replace('block_', ''),loc:{x:divElement.style.left,y:divElement.style.top}})
    });
    _export_text = JSON.stringify(_export_spec, null, 4);
    console.log(_export_text)
    navigator.clipboard.writeText(_export_text);
    alert("Copied text to clipboard!");
    return;

}

// Initial setup
//blocks.forEach(makeDraggable);
//blocks.forEach(setupRowDragging);

addBtn.addEventListener('click', () => {
    createBlock();
});

undoBtn.addEventListener('click', undoLastConnection);
arrangeBtn.addEventListener('click', rearrange);
drawPathBtn.addEventListener('click', () => {drawConnections()});
exportBtn.addEventListener('click', () => {exportSpecification()});

window.addEventListener('resize', updateAllConnections);
window.addEventListener('scroll', updateAllConnections);
