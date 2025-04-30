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
let dragListenerActive = false;

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
        if (dragListenerActive){
            elemId = el.id.replace('block_', '');
            entityCoordinatesProxy[elemId] = {"x":`${el.style.left}`,"y":`${el.style.top}`}
        }
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
    const columns =
        Object.entries(erSchemaDict).
            flatMap(([key, value]) => {
                return value.filter((item) => item.hasOwnProperty('related_to') ? item['name']=key+'.'+item['name'] : null);
            });
    columns.forEach(cols=>{
        startRow = document.querySelector(`#${cols.name.replace('.', '\\.')}`);
        endRow = document.querySelector(`#${cols.related_to.replace('.', '\\.')}`);
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

function createBlocksAll() {
    Object.keys(erSchemaDict).forEach(erTable => {
        createBlock(erTable, erSchemaDict[erTable]);
    });
    return
}

//assuming below:
//  _blockTemplate has an HTML table
//  HTML table has an empty last row
function createBlock(_erTableName, _erTableColumns) {
    const _blockTemplate = document.querySelector("#entityblock");
    const _blockTemplateClone = _blockTemplate.content.cloneNode(true);
    const _tRow = _blockTemplateClone.querySelector('tr').cloneNode(true);
    const _tRowLiteral = _tRow.outerHTML;
    //const _lastRow = _blockTemplateClone.querySelectorAll('tr')[1];

    //remove block if already exists
    var _existingElem = document.getElementById(`block_${_erTableName}`);
    if(_existingElem) {
        _existingElem.remove();
    }else{
        blockCount++;
    }

    //circumvent unexpected behavior - _templateTableClone.outerHTML yields undefined hence getting from DOM
    //var name has to be `data` and shape has to be consistent with it's reference in the html template    
    var _blockLiteral = document.querySelector("template").innerHTML;    
    var data = {"tablename":_erTableName};
    const _blockNewElement = createElementFromText(eval('tagFn`' + _blockLiteral + '`'));
    var _blockTBody = _blockNewElement.querySelector('tbody');
    data.items = _erTableColumns;
    var _blockTBodyClone = addBlockRows(data, _tRowLiteral);
    const _lastRow = _blockTBody.lastElementChild;
    _blockTBodyClone.querySelector('tbody').insertAdjacentElement('beforeend', _lastRow);

    _blockTBody.innerHTML = _blockTBodyClone.innerHTML;
    container.appendChild(_blockNewElement);
    blocks.push(_blockNewElement);
    makeDraggable(_blockNewElement);
    setupRowDragging(_blockNewElement);
    return;
}

function addBlockRows(_rowData, _rowLiteral){
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

function rearrangeAll(){
    blocks.forEach(block=>{
        const divElement = document.getElementById(block.id);
        rearrange(divElement);
    });
    dragListenerActive = true;
}

function rearrange(_elem){
    const divElement = _elem;
    const coords = erCoordinatesDict[divElement.id.replace('block_', '')];
    divElement.style.position = 'absolute';
    divElement.style.left = `${coords.x}`;
    divElement.style.top = `${coords.y}`;
}

function exportSpecification() {
    _export_object = {"erSchemaDict":erSchemaDict, "erCoordinatesDict":erCoordinatesDict};
    _export_text = JSON.stringify(_export_object, null, 4);
    console.log(_export_text)
    navigator.clipboard.writeText(_export_text);
    alert("Copied text to clipboard!");
    return;
}

let entityCoordinatesProxy = new Proxy(erCoordinatesDict, {
	set (obj, key, value) {
		// Update the property
		obj[key] = value;

		// Find the matching fields in the DOM
		let fields = document.querySelectorAll(`[name="block_${key}"]`);
        rearrange(fields[0]);
		return true;
	}
});

let entitySchemaProxy = new Proxy(erSchemaDict, {
	set (obj, key, value) {
        _newEntity = !obj.hasOwnProperty(key);
        //set model value
        obj[key] = value;
        
        //sync view
        createBlock(key, value);
		return true;
	}
});

// Initial setup
//blocks.forEach(makeDraggable);
blocks.forEach(setupRowDragging);

exportBtn.addEventListener('click', () => {exportSpecification()});
window.addEventListener('resize', updateAllConnections);
window.addEventListener('scroll', updateAllConnections);

//trigger actions
createBlocksAll();
rearrangeAll();
drawConnections()
