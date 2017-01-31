
/** 
 *  EdgeBuilder
 *
 *  Draw Borders around things in O(N) complexity
 *  ------------------------------------------------
 *  Create a hash of all items (rectangles) by their X
 *  and Y coordinates.
 *
 *  To find a border, iterate the hash and determine the 
 *  item closest to the border on every iteration, and use
 *  the resulting coordinates to create a path.
 *
 */




var PADDING_DEFAULT = 14;
var FLATTEN_WIDTH_SIDES = 70;
var FLATTEN_WIDTH_BOTTOMS = 20;


function EdgeBuilder() {

    this.options = {
        "fill": "transparent",
        "strokeWidth": "1",
        "strokeDashArray": null,
        "strokeColor": "blue",
        "strokeOpacity": "1",
        "padding": PADDING_DEFAULT,
        "endMargin": 0,
        "flatten": false,  
        "flattenSidesWidth": FLATTEN_WIDTH_SIDES,
        "flattenBottomsWidth": FLATTEN_WIDTH_BOTTOMS,
        "gClass": null,
        "pathClass": null,
        "logVerbose": false,
    };

    /**
     *  Simple padding function
     */
    this.addPadding = (item) => {
        var paddedItem = {
            'leftX': item.leftX - this.options.padding,
            'rightX': item.rightX + this.options.padding,
            'topY': item.topY - this.options.padding,
            'bottomY': item.bottomY + this.options.padding,
            'id': item.id
        }

        if (paddedItem.leftX < 0) paddedItem.leftX = 0;
        if (paddedItem.topY < 0) paddedItem.topY = 0;

        return paddedItem;
    };

    this.translate = {
        'top': {
            'leftX': 'rightX',
            'rightX': 'leftX',
            'bottomY': 'topY',
            'topY': 'bottomY',
        },
        'bottom': {
            'leftX': 'leftX',
            'rightX': 'rightX',
            'bottomY': 'bottomY',
            'topY': 'topY',
        },
        'left': {
            'leftX': 'topY',
            'rightX': 'bottomY',
            'bottomY': 'leftX',
            'topY': 'rightX',
        },
        'right': {
            'leftX': 'bottomY',
            'rightX': 'topY',
            'bottomY': 'rightX',
            'topY': 'leftX',
        },
    };

    this.comparators = {
        'top': {
            'isBelow': (y1, y2) => {
                return (y1 < y2);
            },
            'isAbove': (y1, y2) => {
                return (y1 > y2);
            },
            'isAfter': (x1, x2) => {
                return (x1 < x2);
            },
            'isBefore': (x1, x2) => {
                return (x1 > x2);
            }
        },
        'bottom': {
            'isBelow': (y1, y2) => {
                return (y1 > y2);
            },
            'isAbove': (y1, y2) => {
                return (y1 < y2);
            },
            'isAfter': (x1, x2) => {
                return (x1 > x2);
            },
            'isBefore': (x1, x2) => {
                return (x1 < x2);
            }
        },
        'left': {
            'isBelow': (y1, y2) => {
                return (y1 < y2);
            },
            'isAbove': (y1, y2) => {
                return (y1 > y2);
            },
            'isAfter': (x1, x2) => {
                return (x1 > x2);
            },
            'isBefore': (x1, x2) => {
                return (x1 < x2);
            }
        },

        'right': {
            'isBelow': (y1, y2) => {
                return (y1 > y2);
            },
            'isAbove': (y1, y2) => {
                return (y1 < y2);
            },
            'isAfter': (x1, x2) => {
                return (x1 < x2);
            },
            'isBefore': (x1, x2) => {
                return (x1 > x2);
            }
        },

    };

    this.max = {
        'top': (things) => {
            return Math.min(...things);
        },
        'bottom': (things) => {
            return Math.max(...things);
        },
        'left': (things) => {
            return Math.min(...things);
        },
        'right': (things) => {
            return Math.max(...things);
        },
    };

    // debugging:
    this.path_log = [];
    this.log = (msg) => {
        this.path_log.push(msg);
        if (this.options.logVerbose) {
            console.log(msg);
        }
    };

    /**
     *  Generic method to make a path for a side/edge
     *  in O(N) complexity.
     *  @constructor 
     *  @param {array} hash - A sparse array of x or y coordinates
     *                        of sparse arrays of x or y items.
     */
    this.makePath = (hash, edge, flat=true) => {
        var log = this.log;
        var path = [];
        var keys = Object.keys(hash);
        var keysLength = keys.length;

        var {leftX, rightX, bottomY, topY} = this.translate[edge];
        var {isAbove, isBelow, isAfter, isBefore} = this.comparators[edge];
        var flatten = this.flatten(edge);
        var max = this.max[edge];

        var prevItem = null;
        var aboveItems = [];
        if (edge === 'right' || edge === 'top') {
            keys.reverse();
        }        

        // For each coordinate in the hash:
        for (var k = 0; k < keysLength; k = k + 1) {
            var key = keys[k];
            var items = hash[key]; 
            var itemKeys = Object.keys(items);
            var maxItemKey = max(itemKeys);
            var item = items[maxItemKey];
            var nextItem = null;
            var nextItems = [];
            if (k < (keysLength - 1)) {
                var nextKey = keys[k+1];
                nextItems = hash[nextKey];
                var nextItemKeys = Object.keys(nextItems);
                var maxNextItemKey = max(nextItemKeys);
                var nextItem = nextItems[maxNextItemKey];
            }

            // If first iteration, add first path
            if (k === 0) {
                path.push([item[leftX], item[bottomY], item.id]);
                prevItem = item;

                // Add any other items to Above:
                items.forEach(function(itemA){
                    if (itemA.id !== item.id){
                        aboveItems[itemA[bottomY]] = itemA;
                    }
                });
            }

            log( k + "/" + keysLength+" ... coord: " + key + " --  item: " +item.id + "  prev: "+ prevItem.id  + " - " + itemKeys.length + " hashed items ")
            
            // DEBUG!
            // short circuit:
            // if (k > 80) {
            //     // break;
            // }
            // item.item.style.backgroundColor = '#ccc';
            // item.item.style.opacity = 0.7;


            // If middle iteration:
            if ((0 < k) && (k < (keysLength))) {

                // Handle cases where we are within previous x.
                if (isBefore(item[leftX], prevItem[rightX])) {

                    if (isBelow(item[bottomY], prevItem[bottomY])) {
                        // We are Below:
                        //   |||||
                        //      ||||| <--
                        
                        // Easy, go to current item.
                        path.push([item[leftX], prevItem[bottomY], item.id]);
                        path.push([item[leftX], item[bottomY], item.id]);
                        // Add any other items to Above:
                        items.forEach(function(itemA){
                            if (itemA.id !== item.id){
                                aboveItems[itemA[bottomY]] = itemA;
                            }
                        });
                        log("        [Moving Down] to item: " + item.id)
                        prevItem = item;


                    } else {
                        // We are Above; Add (all items here) to Above:
                        //      ||||||  <--
                        //   ||||||             
                        
                        items.forEach(function(itemA){
                            aboveItems[itemA[bottomY]] = itemA;
                            log("        ++ adding " + itemA.id + " to above items");
                        });

                    }

                } 
                else {
                    // Scenarios where we are after previous item. Tricky.
                    //          ||||| <--
                    //   ||||

                    // If above items, iterate and go to each as long as we are within this items X.
                    var aboveKeys = Object.keys(aboveItems);
                    var aboveLen = aboveKeys.length;
                    log( "     Attempt to traverse up...  above items count: " + aboveLen)

                    if (aboveLen > 0) {


                        if (['left', 'top'].includes(edge)) {
                            var _travA = 0;
                            var _travCompare = isBelow;
                            var _travCompareTo = aboveLen;
                            var _travIncrement = 1;
                        } else {
                            var _travA = (aboveLen - 1);
                            var _travCompare = isBelow;
                            var _travCompareTo = 0;
                            var _travIncrement = -1;
                        }                            


                        for (var a = _travA; _travCompare(a, _travCompareTo); a = a + _travIncrement) {
                            
                            var key = aboveKeys[a];
                            var aboveItem = aboveItems[key];

                            log("      ^ traversing up above id: " + aboveItem.id)

                            // Break if we are after current item:
                            if (isAfter(prevItem[rightX], item[leftX])) {
                                log("     #   breaking ...   prev id:  " + prevItem.id + " rx: "
                                 + prevItem[rightX] + " item.id " + item.id + " leftx " + item[leftX])
                                break;
                            }

                            // Go to this above item (if its right x is greater than previous above X)
                            if (isAfter(aboveItem[rightX], prevItem[rightX])) {
                                log("               [Moving up] to above item " + aboveItem.id)
                                path.push([prevItem[rightX], prevItem[bottomY], item.id]);
                                path.push([prevItem[rightX], aboveItem[bottomY], item.id]);
                                
                                // Set previous to last above:
                                prevItem = aboveItem;

                            } else {
                                log("      [skip] item: "+ aboveItem.id + " rightx: " + aboveItem[rightX] 
                                    + " prev item: " + prevItem.id + " rightx: " + prevItem[rightX])
                                continue;
                            }
                        } 
                    }
                    
                    // Handle current item - if we are within previous x and above; Add to above items
                    if (isBefore(item[leftX], prevItem[rightX]) && isAbove(item[bottomY], prevItem[bottomY])) {
                        aboveItems[item[bottomY]] = item;
                    } else {
                        // For all other situations (after previous x, or below) just path to item.
                        if (isAbove(item[bottomY], prevItem[bottomY])) {
                            path.push([prevItem[rightX], prevItem[bottomY], item.id]);
                            path.push([prevItem[rightX], item[bottomY], item.id]);
                        } else {
                            // We are below:
                            path.push([item[leftX], prevItem[bottomY], item.id]);
                            path.push([item[leftX], item[bottomY], item.id]);
                        }
                        prevItem = item;
                    }
                }
            }

            //  - - - - - - - - - - -  HANDLE LAST ITEM  - - - - - - - - - - - - -
            if (k === (keysLength - 1)){
                if (isBelow(item[bottomY], prevItem[bottomY])) {
                    // If we are below, we are the last item. Close path:
                    path.push([item[leftX], prevItem[bottomY], item.id]);
                    path.push([item[leftX], item[bottomY], item.id]);
                    path.push([item[rightX], item[bottomY], item.id]);
                } else {
                    var aboveKeys = Object.keys(aboveItems);
                    var aboveLen = aboveKeys.length;
                    if (aboveLen > 0) {
                        if (['left', 'top'].includes(edge)) {
                            var _travA = 0;
                            var _travCompare = isBelow;
                            var _travCompareTo = aboveLen;
                            var _travIncrement = 1;
                        } else {
                            var _travA = (aboveLen - 1);
                            var _travCompare = isBelow;
                            var _travCompareTo = 0;
                            var _travIncrement = -1;
                        }
                        // console.log(" --- traversing up above items in final item ----")
                        // console.log("     previous item: " + prevItem.id + " x1: " + prevItem[leftX] + " x2: " + prevItem[rightX])
                        for (var a = _travA; _travCompare(a, _travCompareTo); a = a + _travIncrement) {
                            log("                   ^ traversing up ")
                            var key = aboveKeys[a];
                            var aboveItem = aboveItems[key];
                            // console.log("     above item: " + aboveItem.id + " x1: " + aboveItem[leftX] + " x2: " + aboveItem[rightX])

                            // Go to this above item (if its right x is greater than previous above X)
                            if (isAfter(aboveItem[rightX], prevItem[rightX])) {
                                log("               [Moving up] (last iteration) to above item " + aboveItem.id)
                                path.push([prevItem[rightX], prevItem[bottomY], item.id]);
                                path.push([prevItem[rightX], aboveItem[bottomY], item.id]);
                                
                                // Set previous to last above:
                                prevItem = aboveItem;

                            } else {
                                // console.log("    continue in above iteration..... ")
                                continue;
                            }

                            // Break if we are after current item:
                            if (!isBefore(aboveItem[rightX], item[rightX])) {
                                break;
                            }
                        } 
                    }
                    // ----


                    // Make sure we're After...
                    if (!isBefore(item[rightX], prevItem[rightX])) {
                        path.push([prevItem[rightX], prevItem[bottomY], item.id]);
                        path.push([prevItem[rightX], item[bottomY], item.id]);
                        path.push([item[rightX], item[bottomY], item.id]);
                    } else {
                        // Maybe we are above, and before. In which case just place the last 
                        // path on the prev item.
                        if (isAbove(item[bottomY], prevItem[bottomY])) {
                            log("   Case where we are before and above.")
                            path.push([prevItem[rightX], prevItem[bottomY], item.id]);
                        }
                    }

                    // var final = [[prevItem[rightX], prevItem[bottomY], item.id],
                    //              [prevItem[rightX], item[bottomY], item.id],
                    //              [item[rightX], item[bottomY], item.id]];
                    // // console.log("final:")
                    // // console.log(final)
                    // // Some debugging
                    // final.forEach((coord, c) => {
                    //     var dot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                    //     dot.setAttribute("cx", coord[0]);
                    //     dot.setAttribute("cy", coord[1]);
                    //     dot.setAttribute("r", (c+1) * 4);
                    //     dot.setAttribute("fill", "transparent");
                    //     dot.setAttribute("stroke", "blue");
                    //     dot.setAttribute("stroke-width", "1");
                    //     dot.setAttribute("stroke-opacity", "0.3");
                    //     ListCarta.Layout.layoutSvg.appendChild(dot);
                    // });
                }
            }
        }

        if (this.options.flatten) {
            flatten(path);
        }
        path = this.dedupPath(path); 

        if (['left', 'right'].includes(edge)) {
            path = this.reversePathCoordinates(path);
        }
        
        return path;
    }

    /**
     *  Remove Extraneous points.
     *  Redundant points break stitching process.
     *
     *
     *      B ------C------D
     *      |       ^
     *  --- A       | 
     *          (Remove C)
     *
     *         A
     *  -------o----o--  <-- (Remove A or B) 
     *         B    C
     *
     */
    this.dedupPath = (path) => {
        var dedupedPath = [];
        var prevCoord = null;
        var nextCoord =  null;
        var skip = false;
        for (var c = 0; c < path.length; c = c + 1) {

            var coord = path[c];

            if (c < (path.length - 1)) {
                nextCoord = path[c+1];
            } else {
                nextCoord = null;
            }

            if (prevCoord && nextCoord) {
                if ((prevCoord[0] === coord[0]) && (coord[0] === nextCoord[0])) {
                    continue;
                }
                if ((prevCoord[1] === coord[1]) && (coord[1] === nextCoord[1])) {
                    continue;
                }
            }

            if (prevCoord) {
                if ((coord[0] === prevCoord[0]) && (coord[1] === prevCoord[1])) {
                    continue;
                }
            }

            dedupedPath.push(coord);

            prevCoord = coord;
        };
        return dedupedPath;
    };


    this.draw = (items, edges=['bottom', 'right', 'top', 'left'], options={}) => {
        if (edges[0] === 'all' ) {
            edges = ['bottom', 'right', 'top', 'left'];
        }

        Object.assign(this.options, options);

        var hashes = this.makeHashes(items);

        return this.drawPathFromHash(hashes, edges);
    };

    this.drawPath = (items, edges=['bottom', 'right', 'top', 'left']) => {
        if (edges[0] === 'all' ) {
            edges = ['bottom', 'right', 'top', 'left'];
        }

        var hashes = this.makeHashes(items);

        return this.drawPathFromHash(hashes, edges);
    };

    /**
     *  Sparse array of sparse arrays by their 'left-most' 
     *  and 'bottom-most' coordinates relative to their respective sides.
     *
     */
    this.makeHashes = (items, addPadding=true) => {
        var that = this;
        var hash = [];
        var topHash = [];       // Hash by right X, and top Y
        var bottomHash = [];    // Hash by left X, and bottom Y
        var leftHash = []       // Hash by top Y, and left X
        var rightHash = [];     // Hash by bottom Y, and right X 

        items.forEach(function(item, i) {
            if (addPadding) {
                item = that.addPadding(item);
            }
            if (that.options.endMargin > 0) {
                if (i === 0) {
                    item.leftX = item.leftX + that.options.endMargin;
                }
                if (i === (items.length - 1)) {
                    item.rightX = item.rightX - that.options.endMargin;
                }
            }


            if (bottomHash[item.leftX] === undefined) {
                bottomHash[item.leftX] = [];
            }
            bottomHash[item.leftX][item.bottomY] = item;

            if (rightHash[item.bottomY] === undefined) {
                rightHash[item.bottomY] = [];
            }
            rightHash[item.bottomY][item.rightX] = item;

            if (topHash[item.rightX] === undefined) {
                topHash[item.rightX] = [];
            }
            topHash[item.rightX][item.topY] = item;

            if (leftHash[item.topY] === undefined) {
                leftHash[item.topY] = [];
            }
            leftHash[item.topY][item.leftX] = item;
        });
        hash['bottom'] = bottomHash;
        hash['right'] = rightHash;
        hash['top'] = topHash;
        hash['left'] = leftHash;

        return hash;
    }

    this.drawPathFromHash = (hashes, edges=['bottom', 'right', 'top', 'left']) => {
        var that = this;

        var pathSides = {
            'bottom': [],
            'top': [],
            'left': [],
            'right': [],
        }

        // DEBUGGING!
        // var pathString = this.makePathStringFromObject(paths);
        // var svgPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        // svgPath.setAttribute("d", pathString);
        // svgPath.setAttribute("class", "row");
        // svgPath.setAttribute("stroke", "blue");
        // svgPath.setAttribute("fill", this.fill);
        // svgPath.setAttribute("stroke-opacity", 0.2);
        // svgPath.setAttribute("stroke-dasharray", "2,2");
        // svgPath.setAttribute("stroke-width", 2);
        // ListCarta.Layout.layoutSvg.appendChild(svgPath); 

        // // Debugging. Original not flat path.
        // var pathStringUnflat = this.makePathStringFromObject(unflatPaths);
        // var svgPath2 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        // svgPath2.setAttribute("d", pathStringUnflat);
        // svgPath2.setAttribute("class", "row");
        // svgPath2.setAttribute("stroke", "red");
        // svgPath2.setAttribute("fill", this.fill);
        // svgPath2.setAttribute("stroke-opacity", 0.4);
        // svgPath2.setAttribute("stroke-width", this.strokeWidth );
        // svgPath2.setAttribute("stroke-width", 2);
        // svgPath2.setAttribute("stroke-dasharray", "1,4");
        // ListCarta.Layout.layoutSvg.appendChild(svgPath2); 

        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        var svgPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');

        if (edges.length === 1) {
            var edge = edges[0];
            var hash = hashes[edge];
            var unflatPath = that.makePath(hash, edge, false);
            var pathString = this.pathToString(unflatPath);
        } else {
            // Make border for all sides.
            edges.forEach(function(edge){
                var hash = hashes[edge];
                var newPath = that.makePath(hash, edge);
                pathSides[edge] = newPath;
            });            
            var stitchedPaths = this.stitchPaths(pathSides);
            var pathString = this.pathToString(stitchedPaths);
        }
        svgPath.setAttribute("d", pathString);
        svgPath.setAttribute("fill", this.options.fill);
        svgPath.setAttribute("class", this.options.pathClass);
        svgPath.setAttribute("stroke", this.options.strokeColor);
        svgPath.setAttribute("stroke-opacity", this.options.strokeOpacity);
        svgPath.setAttribute("stroke-width", this.options.strokeWidth);
        svgPath.setAttribute("stroke-dasharray", this.options.strokeDashArray);
        g.setAttribute("class", this.options.gClass);
        g.appendChild(svgPath);

        return g;
    };

    /**
     *  Stitch all paths together coherently.
     *  -------------------------------------
     *  Loop through current path and add coordinates until we intersect with
     *  the next path. After intersecting, detect when current and next paths
     *  diverge and always take the longer path that goes "upward" into the 
     *  center of the bunch of items.
     */
    this.stitchPaths = (paths) => {
        var that = this;
        var stitchedPath = [];

        var order = ['bottom', 'right', 'top', 'left'];
        // var order = ['bottom'];

        var reverseXAxis = (edge === 'right' || edge === 'top') ? true : false;
        var reverseYAxis = (edge === 'top' || edge === 'left') ? true : false;
        var max = (reverseYAxis) ? Math.max : Math.min;

        // All overlaps start with a point in common
        // Detect divergent paths and always take the longest path.

        var cc = 0;

        // For each side:
        for (var o = 0; o < order.length; o = o + 1) {
            var edge = order[o];
            var coords = paths[edge];
            var oo = (o < 3) ? (o + 1) : 0;
            var nextEdge = order[oo];
            var nextCoords = paths[nextEdge];
            if (nextCoords.length === 0) {
                break;
            }
            var {isAbove, isBelow, isAfter, isBefore} = this.comparators[edge];

            var x  = (edge === 'right' || edge === 'left') ? 1 : 0 ;
            var y  = (edge === 'right' || edge === 'left') ? 0 : 1 ;
            var nx = (nextEdge === 'right' || nextEdge === 'left') ? 1 : 0 ;
            var ny  = (nextEdge === 'right' || nextEdge === 'left') ? 0 : 1 ;

            var overlapping = false;

            var n = 0;
            var c = 0;
            var nextCoord = nextCoords[n];

            // Diverging variables
            var currentDiverges = false;
            var nextDiverges = false;
            var intersectCoord = null;
            var nextNextCoord = null;
            var nextCurrentCoord = null;


            // For every coordinate:
            for (var c = cc; c < coords.length; c = c + 1) {

                // console.log( edge + " -  c: " + c + " of " + coords.length +", n: " + n)

                var currentCoord = coords[c];
                var nextCoord = nextCoords[n];

                // DEBUGGING!
                // // Next coords are red circle outlines
                // var dot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                // dot.setAttribute("cx", nextCoord[x]);
                // dot.setAttribute("cy", nextCoord[y]);
                // dot.setAttribute("r", "6");
                // dot.setAttribute("fill", "transparent");
                // dot.setAttribute("stroke", "red");
                // dot.setAttribute("stroke-width", "1");
                // dot.setAttribute("stroke-opacity", "0.8");
                // ListCarta.Layout.layoutSvg.appendChild(dot);

                // // Current coords are blue circle outlines
                // var dot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                // dot.setAttribute("cx", currentCoord[x]);
                // dot.setAttribute("cy", currentCoord[y]);
                // dot.setAttribute("r", "4");
                // dot.setAttribute("fill", "transparent");
                // dot.setAttribute("stroke", "blue");
                // dot.setAttribute("stroke-width", "1");
                // dot.setAttribute("stroke-opacity", "0.8");
                // ListCarta.Layout.layoutSvg.appendChild(dot);


                // Before overlap, add everything:
                if (!overlapping) {
                    stitchedPath.push(currentCoord);
                    // console.log("    - add current coord before next path found: "
                    //     + currentCoord[0]
                    //     + ", " + currentCoord[1]
                    //     + ", " + currentCoord[2])
                }

                // Overlap / Diverging
                if ((currentCoord[x] === nextCoord[x]) && (currentCoord[y] === nextCoord[y])) {
                    // console.log("     - equal - ")
                    if (!overlapping) {
                        // console.log(edge + " found first overlap with next path(!) ")
                        overlapping = true;                     
                    }

                    if (currentDiverges) {
                        // Do we intersect again?
                        if ((currentCoord[x] === intersectCoord[x]) 
                             && (currentCoord[y] === intersectCoord[y])) {

                            intersectCoord = null;
                            currentDiverges = false;
                            // console.log("    - [XXXX] current path has intersected. Undiverging.")
                        }
                    }

                    // Always add if we are equal:
                    // console.log("    - adding coord (equal): " 
                    //     + currentCoord[0]
                    //     + ", " + currentCoord[1]
                    //     + ", " + currentCoord[2] )                    
                    stitchedPath.push(currentCoord);

                    // Increment next coord:
                    n = n + 1;


                } else {
                    // console.log("     - NOT equal - ")

                    // We are Diverging; Determine which path is longer.
                    if (overlapping && (!currentDiverges)) {

                        if (nextCoords[n+1] !== undefined) {
                            nextNextCoord = nextCoords[n+1];
                        } 
                        if (coords[c+1] !== undefined) {
                            nextCurrentCoord = coords[c+1];
                        }

                        if (nextCurrentCoord && nextNextCoord) {
                            // Current Coord is divergent, scenario A:
                            if ((currentCoord[x] === nextCoord[x])
                                 && (isAfter(nextNextCoord[x], nextCoord[x]))
                                 && (isAbove(currentCoord[y], nextCoord[y]))) {
                                currentDiverges = true;
                            } 
                            // Current Coord diverges, scenario B:
                            if ((currentCoord[y] ===  nextCoord[y])
                                 && isBefore(currentCoord[x], nextCoord[x])
                                 && isAbove(nextCurrentCoord[y], currentCoord[y])) {
                                currentDiverges = true;
                            }

                        }

                        if(currentDiverges) {

                            // DEBUGGING!
                            // divergent point:
                            // var dot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                            // dot.setAttribute("cx", currentCoord[x]);
                            // dot.setAttribute("cy", currentCoord[y]);
                            // dot.setAttribute("r", "2");
                            // dot.setAttribute("fill", "blue");
                            // dot.setAttribute("stroke-opacity", "0.9");
                            // ListCarta.Layout.layoutSvg.appendChild(dot);
                            // intersection point
                            // Big yellow filled circle
                            // if (intersectCoord) {
                            //     // var dot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                            //     // dot.setAttribute("cx", intersectCoord[x]);
                            //     // dot.setAttribute("cy", intersectCoord[y]);
                            //     // dot.setAttribute("r", "9");
                            //     // dot.setAttribute("fill", "yellow");
                            //     // // dot.setAttribute("stroke", "blue");
                            //     // // dot.setAttribute("stroke-width", "1");
                            //     // dot.setAttribute("stroke-opacity", "0.5");
                            //     // ListCarta.Layout.layoutSvg.appendChild(dot);   
                            // }

                            n = n + 1;
                            intersectCoord = nextCoords[n];                    
                        }

                        // Next Coord diverges:
                        if(nextNextCoord && (c < (coords.length -1))) {
                            if ((currentCoord[x] === nextCoord[x])
                                 && isBefore(nextNextCoord[x], nextCoord[x])
                                 && isBelow(nextCoord[y], currentCoord[y])) {

                                // console.log("    - next path is divergent, adding next coords...")
                                intersectCoord = coords[c+1];

                                while (n < nextCoords.length) {
                                    // Add next Coord:

                                    // console.log(" n: (" + n + ")  - adding next-path coord, n:  " 
                                    //     + nextCoord[0]
                                    //     + ", " + nextCoord[1]
                                    //     + ", " + nextCoord[2] )                                    
                                    stitchedPath.push(nextCoord);

                                    if ((nextCoord[x] === intersectCoord[x])
                                         && (nextCoord[y] === intersectCoord[y])) {
                                        break;
                                    }
                                    nextCoord = nextCoords[n];
                                    n = n + 1;
                                }
                            }
                        }
                    }

                    if (overlapping && currentDiverges) {
                        // console.log("    - current diverging; adding coord: " 
                        //     + currentCoord[0]
                        //     + ", " + currentCoord[1]
                        //     + ", " + currentCoord[2] )
                        stitchedPath.push(currentCoord);
                    }
                }
          
            };

            // Start next side where we left off:
            cc = n;

        };

        // Our end overlaps the beginning. 
        // The bottom path may have some bad coordinates.
        // We have to trim from the beginning path up until the last path on the Left.
        var lastCoord = stitchedPath[stitchedPath.length - 1];
        for (var t = 0; t < stitchedPath.length; t = t + 1) {
            // console.log(" trimming " + t)
            var tcoord = stitchedPath[t];
            if ((tcoord[x] === lastCoord[x]) && (tcoord[y] === lastCoord[y])) {
                break;
            }
        }
        stitchedPath.splice(0, t);



        return stitchedPath;
    };


    this.stitchEnd = (path, lastPath) => {
        var lastItem = lastPath[0];
        var stitched = path.slice();
        for (var p = path.length - 1; p > 0; p = p - 1) {
            var item = path[p];
            if (item[2] == lastItem[2]) {
                break;
            }
        }
        stitched.splice(p, path.length);
        return stitched;
    }


    /**
     *
     *  Makes a path string from an object of path sides
     *
     */
    this.makePathStringFromObject = (paths) => {
        var that = this;
        var pathString = " ";
        var order = ['bottom', 'right', 'top', 'left'];

        order.forEach((edge) => {
            var pathCoords = paths[edge];

            pathCoords.forEach((coords, i) => {
                // if ( i < 10 ) { 
                if (i === 0) {
                    pathString = pathString + " M " + coords[0] + " " + coords[1];
                } else {
                    pathString = pathString + " L " + coords[0] + " " + coords[1];
                }
                // }
            });

        });
        return pathString;
    };

    /**
     *  Simply create a string out of a list of coordinates.
     *
     */
    this.pathToString = (path) => {
        var pathString = ' ';
        path.forEach((coords, i) => {
            if (i === 0) {
                pathString = pathString + " M " + coords[0] + " " + coords[1];
            } else {
                pathString = pathString + " L " + coords[0] + " " + coords[1];
            }            
        });
        return pathString;
    };

    this.makePathStringStitched = (stitchedPath) => {
        var pathString = '';
        stitchedPath.forEach((coords, i) => {
            if (i === 0) {
                pathString = pathString + " M " + coords[0] + " " + coords[1];
                // console.log(coords[0] + ", " + coords[1])
            } else {
                pathString = pathString + " L " + coords[0] + " " + coords[1];
                // console.log(coords[0] + ", " + coords[1])
            }
        });
        return pathString;
    }


    this.reversePathCoordinates = (path) => {
        // Just reverse x and y coordinates..
        var newPath = [];
        path.forEach((p) => {
            newPath.push([p[1], p[0], p[2]]);
        });
        return newPath;
    };


    /**
     *  For every coordinate that moves up into the center of the bunch, 
     *  find the width of the gap created and store in a data structure. 
     *  Iterate data structure and collapse points whose width is larger 
     *  than we would like.
     */
    this.flatten = (edge) => {

        if (edge === 'left' || edge === 'right') {
            var WIDTH = this.options.flattenSidesWidth;
        } else {
            var WIDTH = this.options.flattenBottomsWidth;
        }

        var x = 0;
        var y = 1;

        var reverseXAxis = (edge === 'right' || edge === 'top') ? true : false;
        var reverseYAxis = (edge === 'top' || edge === 'left') ? true : false;
        var max = (reverseYAxis) ? Math.max : Math.min;
        var isAbove = this.comparators[edge]['isAbove'];

        return (path) => {
            
            var prevCoord = null;

            var allPairs = [];     // Pairs of coordinates.
            var upwardPairs = [];  // Pairs of upward coordinates.

            path.forEach((coord, p) => {
                // console.log("flatten: " + coord[0] + " -- " + coord[1])

                if (prevCoord) {

                    // [Going down]
                    if (isAbove(prevCoord[y], coord[y])) {

                        var ups = (reverseXAxis) 
                            ? upwardPairs.slice((coord[x]+1), (coord[x] + WIDTH))
                            : upwardPairs.slice((coord[x] - WIDTH), (coord[x]));

                        var upKeys = Object.keys(ups);
                        if (upKeys.length > 0) {
                            // Find the lowest Upward Pair:
                            if (reverseXAxis) { upKeys.reverse(); }
                            var firstKey = upKeys[0];
                            var firstUp = ups[firstKey];
                            var startingY = path[firstUp.p0][y];
                            var startingX = path[firstUp.p0][x];

                            // Whichever is higher:
                            var adjustedY = max(coord[y], startingY);

                            // Adjust Y for ALL pairs:
                            // Caveat: Dont go farther back than last up
                            var all = (reverseXAxis) 
                                ? allPairs.slice((coord[x]+1), (startingX + 1))
                                : allPairs.slice((startingX -1), (coord[x]));

                            all.forEach((pair) => {
                                // Only adjust if lower:
                                if (isAbove(path[pair.p1][y], adjustedY)) {
                                    path[pair.p1][y] = adjustedY;
                                    path[pair.p2][y] = adjustedY;
                                }
                            });
                        }
                    }

                    // [Going UP]:
                    var coordPair = {
                        'p0': (p-1), // Previous
                        'p1': p,     // Current
                        'p2': (p+1)  // Next
                    }
                    if (isAbove(coord[y], prevCoord[y])) {
                        upwardPairs[coord[x]] = coordPair;
                    }
                    // [Every Path]:
                    allPairs[coord[x]] = coordPair;
                }
                prevCoord = coord;
            });
        }
    }

}

module.exports = EdgeBuilder;