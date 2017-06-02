var canvas = document.getElementById('canvas');
var ctx = canvas.getContext("2d");
var dxfWindow = document.getElementById("dxfArea");
var showCoords = true;

// Start by setting up the canvas and adding the stub dxf
run();

// Main function called when the user presses the run button
function run(){
    clearCanvas();
    dxfWindow.value = "0\nSECTION\n2\nHEADER\n9\n$EXTMIN\n10\n-400\n20\n-300\n30\n0\n9\n$EXTMAX\n" +
                        "10\n400\n20\n300\n30\n0\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n";
    var codeWindow = document.getElementById("codeArea");
    var lineArray = codeWindow.value.split("\n");
    for(i=0; i<lineArray.length; i++){
        parseLine(lineArray[i]);
    }
    // do we need to add some closing dxf lines?
}

// Erase and then redraw the canvas axes
function clearCanvas(){
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the x and y axes
    ctx.strokeStyle = "Gainsboro";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height/2);
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
    ctx.closePath();
    
    // Add the numbers to the axes
    if(showCoords){
        ctx.font = "14px Arial";
        ctx.fillStyle = "LightSlateGray";
        ctx.fillText("100", 487, 317);
        ctx.fillText("200", 587, 317);
        ctx.fillText("300", 687, 317);
        ctx.fillText("-100", 283, 317);
        ctx.fillText("-200", 183, 317);
        ctx.fillText("-300", 83, 317);
        ctx.fillText("100", 370, 205);
        ctx.fillText("200", 370, 105);
        ctx.fillText("-100", 366, 405);
        ctx.fillText("-200", 366, 505);
        ctx.fillText("X", 787, 317);
        ctx.fillText("Y", 385, 15);
    }

    // Reset the style for drawing
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
}

// Toggle the display of the coordinates
function toggleCoords(){
    if(showCoords){
        showCoords = false;
        document.getElementById("coords").innerHTML = "Numbers:Off";
    }
    else{
        showCoords = true;
        document.getElementById("coords").innerHTML = "Numbers:On";
    }
    run();
}

// Check each line of code for the instruction and clean out spaces.
// Also require the user to end a line with a semi-colon. This is purely educational.
function parseLine(codeLine){
    var cleanLine = codeLine.replace(/ /g, "");
    if (cleanLine.endsWith(";")){
        if(cleanLine.startsWith("colour=\"")){
            setDrawColour(cleanLine);
        }
        else if(cleanLine.startsWith("line(")){
            drawLine(cleanLine);
        }
        else if(cleanLine.startsWith("arc(")){
            drawArc(cleanLine);
        }
        else if(cleanLine.startsWith("rect(")){
            drawRect(cleanLine);
        }
        else if(cleanLine.startsWith("ellipse(")){
            drawEllipse(cleanLine);
        }
        else if(cleanLine == "face;"){
            drawFace(cleanLine);
        }
    }
}

// Set the colour for drawing entities
function setDrawColour(codeLine){
    var endLoc = codeLine.indexOf("\";");
    var newColour = codeLine.slice(8, endLoc).toLowerCase();
    if(newColour == "black" || newColour == "blue" || newColour == "red" || newColour == "green"){
        ctx.strokeStyle = newColour;
    }
}

// Draw a line from x1,y1 to x2,y2
function drawLine(codeLine){
    var endLoc = codeLine.indexOf(")");
    if (endLoc > -1){
        var coords = codeLine.slice(5, endLoc).split(",");
        var x1 = Number(coords[0]);
        var y1 = Number(coords[1]);
        var x2 = Number(coords[2]);
        var y2 = Number(coords[3]);
        ctx.beginPath();
        ctx.moveTo(canvas.width/2 + x1, canvas.height/2 - y1);
        ctx.lineTo(canvas.width/2 + x2, canvas.height/2 - y2);
        ctx.stroke();

        // Add entry to the dxf window
        dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + x1 + "\n20\n" + y1 + 
                                            "\n11\n" + x2 + "\n21\n" + y2 + "\n";
    }
}

// Draw an arc
function drawArc(codeLine){
    var endLoc = codeLine.indexOf(")");
    if (endLoc > -1){
        var coords = codeLine.slice(4, endLoc).split(",");
        var x = Number(coords[0]);
        var y = Number(coords[1]);
        var radius = Number(coords[2]);
        var startAngle = Number(coords[3]);
        var endAngle = Number(coords[4]);
        ctx.beginPath();
        ctx.arc(canvas.width/2 + x, canvas.height/2 - y, radius, 
                -(startAngle*2*Math.PI)/360, -(endAngle*2*Math.PI)/360, true);
        ctx.stroke();

        // Add entry to the dxf window
        // The dxf format does seem to like full 360 degree arcs
        // So we create a dxf circle in that instance
        if(endAngle - startAngle == 360){
        dxfWindow.value = dxfWindow.value + "0\nCIRCLE\n10\n" + x + "\n20\n" + y + 
                                            "\n40\n" + radius + "\n";
        }
        else{
        dxfWindow.value = dxfWindow.value + "0\nARC\n10\n" + x + "\n20\n" + y + 
                                            "\n40\n" + radius + 
                                            "\n50\n" + startAngle + "\n51\n" + endAngle + "\n";
        }
        
    }
}

// Draw a rectangle with bottom left at x,y then give width and height
// Optional 5th parameter specifies radius of bevel
function drawRect(codeLine){
    var endLoc = codeLine.indexOf(")");
    if (endLoc > -1){
        var coords = codeLine.slice(5, endLoc).split(",");
        var x1 = Number(coords[0]);
        var y1 = Number(coords[1]);
        var x2 = Number(coords[0]) + Number(coords[2]);
        var y2 = Number(coords[1]) + Number(coords[3]);
        var width = Number(coords[2]);
        var height = Number(coords[3]);
        if (coords.length == 5){
            var radius = Number(coords[4]);
            if (radius > width/2 || radius > height/2){
                // Radius is too big
                radius = 0;
            }
        }
        else{
            // No radius provided
            var radius = 0;
        }
        if (radius == 0){   // Draw a rectangle with no bevel
            ctx.beginPath();
            ctx.rect(canvas.width/2 + x1, canvas.height/2 - y1, width, -height);
            ctx.closePath();
            ctx.stroke();

            // Add entry to the dxf window using 4 lines since there is no dxf rect equivalent
            dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + x1 + "\n20\n" + y1 +
                                                "\n11\n" + x1 + "\n21\n" + y2 + "\n";
            dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + x1 + "\n20\n" + y2 +
                                                "\n11\n" + x2 + "\n21\n" + y2 + "\n";
            dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + x2 + "\n20\n" + y2 +
                                                "\n11\n" + x2 + "\n21\n" + y1 + "\n";
            dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + x2 + "\n20\n" + y1 +
                                            "\n11\n" + x1 + "\n21\n" + y1 + "\n";   
        }
        else {   // Draw a bevelled rectangle
            ctx.beginPath();
            ctx.moveTo(canvas.width/2 + x2, canvas.height/2 - y1 - radius);
            ctx.arcTo(canvas.width/2 + x2, canvas.height/2 - y1, 
                      canvas.width/2 + x2 - radius, canvas.height/2 - y1, radius);
            ctx.lineTo(canvas.width/2 + x1 + radius, canvas.height/2 - y1);
            ctx.arcTo(canvas.width/2 + x1, canvas.height/2 - y1, 
                      canvas.width/2 + x1, canvas.height/2 - y1 - radius, radius);
            ctx.lineTo(canvas.width/2 + x1, canvas.height/2 - y2 + radius);
            ctx.arcTo(canvas.width/2 + x1, canvas.height/2 - y2, 
                      canvas.width/2 + x1 + radius, canvas.height/2 - y2, radius);
            ctx.lineTo(canvas.width/2 + x2 - radius, canvas.height/2 - y2);
            ctx.arcTo(canvas.width/2 + x2, canvas.height/2 - y2, 
                      canvas.width/2 + x2, canvas.height/2 - y2 + radius, radius);
            ctx.closePath();
            ctx.stroke();

            // Now do the dxf for the bevelled rectangle
            // First do the lines
            dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + x1 + "\n20\n" + (y1+radius) +
                                                "\n11\n" + x1 + "\n21\n" + (y2-radius) + "\n";
            dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + (x1+radius) + "\n20\n" + y2 +
                                                "\n11\n" + (x2-radius) + "\n21\n" + y2 + "\n";
            dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + x2 + "\n20\n" + (y2-radius) +
                                                "\n11\n" + x2 + "\n21\n" + (y1+radius) + "\n";
            dxfWindow.value = dxfWindow.value + "0\nLINE\n10\n" + (x2-radius) + "\n20\n" + y1 +
                                            "\n11\n" + (x1+radius) + "\n21\n" + y1 + "\n"; 
            // Now the arcs
            dxfWindow.value = dxfWindow.value + "0\nARC\n10\n" + (x1+radius) + "\n20\n" + (y1+radius) + 
                                            "\n40\n" + radius + "\n50\n180\n51\n270\n";
            dxfWindow.value = dxfWindow.value + "0\nARC\n10\n" + (x1+radius) + "\n20\n" + (y2-radius) + 
                                            "\n40\n" + radius + "\n50\n90\n51\n180\n";
            dxfWindow.value = dxfWindow.value + "0\nARC\n10\n" + (x2-radius) + "\n20\n" + (y2-radius) + 
                                            "\n40\n" + radius + "\n50\n0\n51\n90\n"; 
            dxfWindow.value = dxfWindow.value + "0\nARC\n10\n" + (x2-radius) + "\n20\n" + (y1+radius) + 
                                            "\n40\n" + radius + "\n50\n270\n51\n0\n";                                                               
        }                            
    }
}

// Draw an ellipse.
// Canvas has no ellipse command so we end up creating a stretched arc.
function drawEllipse(codeLine){
    var endLoc = codeLine.indexOf(")");
    if (endLoc > -1){
        var coords = codeLine.slice(8, endLoc).split(",");
        var x = Number(coords[0]);
        var y = Number(coords[1]);
        var width = Number(coords[2]);
        var height = Number(coords[3]);
        ctx.save();
        if (width > height){
            var xScale = width/height;
            ctx.scale(xScale, 1);
            var radius = height/2;
            var yScale = 1;

            // Do dxf here since the dxf ellipse is dependent on orientation
            dxfWindow.value = dxfWindow.value + "0\nELLIPSE\n10\n" + x + "\n20\n" + y + 
                                                "\n11\n" + (width/2) + "\n21\n" + y + "\n40\n" + 1/xScale + 
                                                "\n41\n0\n42\n6.283185307179586\n";
        }
        else if (height > width){
            var yScale = height/width;
            ctx.scale(1, yScale);
            var radius = width/2;
            var xScale = 1;
            dxfWindow.value = dxfWindow.value + "0\nELLIPSE\n10\n" + x + "\n20\n" + y + 
                                                "\n11\n" + (height/2) + "\n21\n" + x + "\n40\n" + 1/yScale + 
                                                "\n41\n0\n42\n6.283185307179586\n";
        }
        else {  // width = height
            radius = width/2;  // just a circle
            dxfWindow.value = dxfWindow.value + "0\nCIRCLE\n10\n" + x + "\n20\n" + y + 
                                            "\n40\n" + radius + "\n";
        }
        
        // Draw the circle on the scaled canvas, then restore the previous settings to stretch it.
        ctx.beginPath();
        ctx.arc(canvas.width/(2*xScale) + x/xScale, canvas.height/(2*yScale) - y/yScale, radius, 0, 2*Math.PI);
        ctx.restore();
        ctx.stroke();
    }
}

// Give the code for a sample face
function drawFace(codeLine){
    var codeWindow = document.getElementById("codeArea");
    codeWindow.value = "arc(0,0,150,0,360);\ncolour=\"blue\";\narc(-50,50,20,0,360);\n" +
                       "arc(50,50,20,0,360);\ncolour=\"green\";\nline(0,20,20,-20);\n" +
                       "line(20,-20,-20,-20);\nline(-20,-20,0,20);\ncolour=\"red\";\n" +
                       "arc(0,0,100,210,330);\n";
}