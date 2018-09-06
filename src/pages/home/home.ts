import { Component } from '@angular/core';
import { MenuController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

    boardSquares: BoardSquare[]; // [BoardSquare]
    isSimpleMode: boolean = true;
    isBlackTurn: boolean = true;
    blackSelection: BoardSquare; // BoardSquare
    whiteSelection: BoardSquare; // BoardSquare
    blackLocked: BoardSquare; // BoardSquare
    whiteLocked: BoardSquare; // BoardSquare
    targetSignal: number[];

    constructor(public menu: MenuController) {
        menu.enable(true);

        window.addEventListener('message', console.log);

        let sig1 = [0.1,0.2,0.3,0.4,0.5,0.6],
        // let sig1 = [1,2,1,2,1,2],
            // sig2 = [0.24,0.942,0.85,0.324,0.63,0.1274];
            // sig2 = [0.1,0.2,0.3,0.4,0.5,0.6];
            sig2 = [0.6,0.5,0.4,0.3,0.2,0.1];
            // sig2 = [0,0,0,0,0,0];
            // sig2 = [2,2,2,2,2,2];
        // let sig1 = [1,2,3,4,5,6,7,8,9,10,11,12],
        //     sig2 = [12,11,10,9,8,7,6,5,4,3,2,1];
            // sig2 = [0,0,0,0,0,0];
        // let sig1 = [1,3,5,7,9,11],
        //     sig2 = [11,9,7,5,3,1];
        // let sig1 = [2,4,6,8,10,12],
        //     sig2 = [12,10,8,6,4,2];
        // let sig1 = [1,3,5,7,9,11],
        //     sig2 = [2,4,6,8,10,12];
        // let sig2 = [1,3,5,7,9,11],
        //     sig1 = [2,4,6,8,10,12];
        // let sig2 = [24,22,20,18,16,14,12,10,8,6,4,2],
        //     sig1 = [2,4,6,8,10,12,14,16,18,20,22,24];
        // let sig1 = [2,4,6,8,10,12],
        //     sig2 = [3,6,9,12,15,18];
        // let sig1 = [2,4,6,8,10,12],
        //     sig2 = [1,2,4,7,11,16];
        // let sig1 = [2,4,6,8,10,12],
        //     sig2 = [1,2,4,7,11,169];
        // let sig1 = [2,4,6,8,10,12],
        //     sig2 = [41224,6124,232,53432,743,624];
        console.log("correlation:", calculateCorrelation(sig1,sig2,false,true));
    }

    ngAfterViewInit() {
        // TODO: particlesJS config should be loaded with consideration of screen size
        window['particlesJS'].load('page-home-content', 'assets/config/particles.json', function() {
            console.log('callback - particles.js config loaded');
        });

        this.boardSquares = setupBoard(gatherBoardSquares(), this.isSimpleMode, true);

        setTimeout(()=> {
            // document.querySelector('iframe').contentWindow.postMessage({message: 'Send forth The Signal'}, "*");
        }, 2000);

        let sig1 = [0.1,0.2,0.3,0.4,0.5,0.6];
        let errorlog = document.querySelector('.error-log');
        let html = '';
        let i = 0;
        let corrs = perms(sig1).map((perm)=> {
            html+=i+'&emsp;';
            html+=calculateCorrelation(sig1,perm,false,true) + '<br>';
            // html+=calculateCorrelation(sig1,perm,false,true) + '&emsp;';
            // html+=calculateCorrelation(sig1,perm,true,true) + '<br>';
            // if(i === 0 || i === 120 || i === 240 || i === 360 || i === 480 || i === 600) {
            //     console.log(i,perm);
            // }
            // html+=calculateCorrelation(sig1,[Math.random(),Math.random(),Math.random(),Math.random(),Math.random(),Math.random()],false,true)+'<br>';
            i++;
        });
        errorlog.innerHTML=html;
        console.log(html);
    }

    // pieceTap(e) {
    //     let pelem = e.target.parentNode,
    //         bsqelem = pelem.parentNode.parentNode,
    //         l = parseInt(bsqelem.getAttribute(LETTER_INDEX_ATTRIB)),
    //         pn = parseInt(bsqelem.getAttribute(POSITION_NUMBER_ATTRIB)),
    //         bsq = this.boardSquares[coordsToBoardIndex(l,pn)],
    //         pc = bsq.piece;
    //
    //     if (this.isBlackTurn) {
    //         if (pc == null) { // move current black locked
    //             let spc = this.blackLocked.piece;
    //             voidMoves(getPossibleMoves(spc.positionLetterIndex, spc.positionNumber, this.boardSquares));
    //             bsq.piece = spc;
    //             this.blackLocked.piece = null;
    //             // this.blackLocked.isBlackSelected = false;
    //             this.blackLocked.isDisturbed = false;
    //             this.blackLocked.nativeElement.querySelector('.piece').classList.remove('disturbed');
    //             this.blackLocked.nativeElement.querySelector('.piece').classList.remove('black-selection');
    //
    //             updateSquarePair(bsq,this.blackLocked, this.isSimpleMode);
    //
    //             // bsq.isBlackSelected = true;
    //             this.blackSelection = bsq;
    //             pelem.classList.add('black-selection');
    //             this.blackLocked = null;
    //             this.isBlackTurn = false;
    //         } else {
    //             if (this.blackSelection != null) {
    //                 if (this.blackSelection.piece.isBlack) {
    //                     removeFocus(this.blackSelection, 'black-selection', this.boardSquares);
    //                 } else {
    //                     this.blackSelection.nativeElement.querySelector('.piece').classList.remove('black-selection');
    //                 }
    //             }
    //
    //             // bsq.isBlackSelected = true;
    //             this.blackSelection = bsq;
    //             pelem.classList.add('black-selection');
    //             if (bsq.piece.isBlack && this.blackLocked == null)
    //                 enableMoves(getPossibleMoves(l,pn,this.boardSquares));
    //         }
    //     } else {
    //         pelem.classList.add('white-selection');
    //         bsq.isWhiteSelected = true;
    //     }
    //     document.querySelector('.error-log').textContent = pelem.outerHTML;
    // }

    pieceTap(e) {
        if(this.isBlackTurn) {
            let res = processPieceTap(e, this.boardSquares, this.blackSelection, this.blackLocked, this.isSimpleMode, this.isBlackTurn);
            this.blackSelection = res.selection;
            this.blackLocked = res.locked;
            this.isBlackTurn = res.isBlackTurn;
        } else {
            let res = processPieceTap(e, this.boardSquares, this.whiteSelection, this.whiteLocked, this.isSimpleMode, this.isBlackTurn);
            this.whiteSelection = res.selection;
            this.whiteLocked = res.locked;
            this.isBlackTurn = res.isBlackTurn;
        }
    }

    piecePress(e) {
        let pelem = e.target.parentNode,
            bsqelem = pelem.parentNode.parentNode,
            l = parseInt(bsqelem.getAttribute(LETTER_INDEX_ATTRIB)),
            pn = parseInt(bsqelem.getAttribute(POSITION_NUMBER_ATTRIB)),
            bsq = this.boardSquares[coordsToBoardIndex(l,pn)];
        if (this.isBlackTurn) {
            if (this.whiteSelection != null) {
                this.whiteSelection.nativeElement.querySelector('.piece').classList.remove('white-selection');
                // this.whiteSelection.isWhiteSelected = false;
            }
            pelem.classList.add('white-selection');
            this.whiteSelection = bsq;
        } else {
            if (this.blackSelection != null) {
                this.blackSelection.nativeElement.querySelector('.piece').classList.remove('black-selection');
                // this.blackSelection.isBlackSelected = false;
            }
            pelem.classList.add('black-selection');
            this.blackSelection = bsq;
        }
    }
}

let processSignalChange = (index: number, value: number, selection: BoardSquare, isStart: boolean, isEnd: boolean)=> {
    // update piece signal
    let signal = selection.piece.signal;
    signal[index] = value;
    // calculate correlation score

    // update piece viewer and signal correlation score
    // return updated board square (?)
}

let calculateCorrelation = (signal: number[], targetSignal: number[], diversityIsRelative: boolean, useDistance: boolean)=> {
    let g = [], gavgs = [], sum = 0;
    signal = normalize(signal);
    targetSignal = normalize(targetSignal);
    for (let i = 0; i < signal.length; i++) {
        let g_ = [];
        for (let j = 0; j < signal.length; j++) {
            g_.push(0);
        }
        g.push(g_);
        gavgs.push(0);
    }

    // console.log(signal,targetSignal);

    for (let i = 0; i < signal.length; i++) {
        for (let j = i+1; j < signal.length; j++) {
            let diff = 0;
            if (useDistance) {
                diff = Math.abs((signal[i]-signal[j])-(targetSignal[i]-targetSignal[j]))/Math.abs(i-j);
            } else {
                diff = Math.abs((signal[i]-signal[j])-(targetSignal[i]-targetSignal[j]));
            }

            // let diff = ((signal[i]-signal[j])-(targetSignal[i]-targetSignal[j]))/Math.abs(i-j);
            // let diff = (signal[i]-signal[j])-(targetSignal[i]-targetSignal[j]);

            // let diff = (Math.abs(signal[i]-signal[j])-Math.abs(targetSignal[i]-targetSignal[j]))/Math.abs(i-j);
            // let diff = Math.abs(signal[i]-signal[j])-Math.abs(targetSignal[i]-targetSignal[j]);
            // console.log(signal[i],signal[j],targetSignal[i],targetSignal[j],Math.abs(signal[i]-signal[j])-Math.abs(targetSignal[i]-targetSignal[j]));
            // console.log(Math.abs(signal[i]-signal[j])-Math.abs(targetSignal[i]-targetSignal[j]));
            g[i][j] = g[j][i] = diff;
        }
        gavgs[i] = g[i].reduce((t,n)=> t+n)/(signal.length-1);
        sum+=g[i].reduce((t,n)=> t+n);
    }
    // console.log(g);
    let progDivDiff = 0;
    if (diversityIsRelative) {
        progDivDiff = sum/(signal.length*(signal.length-1)/2);
    } else {
        progDivDiff = gavgs.reduce((t,n)=>t+n)/signal.length;
    }
    let corr = 1-Math.abs(progDivDiff);
    // console.log('progDivDiff', progDivDiff);
    // console.log('corr', corr);
    return Math.max(0,Math.min(1,corr));
}

let perms = (signal: number[])=> {
    let ps = [];

    // console.log(signal);

    for (let i = 0; i < signal.length; i++) {
        let signal_ = signal.slice(0,signal.length);
        signal_.splice(i,1);
        let subps = perms(signal_);
        if (subps.length == 0) subps.push([]);
        subps.forEach((subp)=> {
            subp.unshift(signal[i]);
            ps.push(subp);
        });
    }

    // console.log('ps',ps);

    return ps;
}

let normalize = (arr: number[])=> {
    let max = Math.max(...arr);
    if (max === 0) return arr;
    return arr.map(x=>x/max);
}

let processPieceTap = (e, bsqs: BoardSquare[], selection: BoardSquare, locked: BoardSquare, isSimpleMode: boolean, isBlackTurn: boolean)=> {
    let pelem = e.target.parentNode,
        bsqelem = pelem.parentNode.parentNode,
        l = parseInt(bsqelem.getAttribute(LETTER_INDEX_ATTRIB)),
        pn = parseInt(bsqelem.getAttribute(POSITION_NUMBER_ATTRIB)),
        bsq = bsqs[coordsToBoardIndex(l,pn)],
        pc = bsq.piece,
        selclass = isBlackTurn ? 'black-selection' : 'white-selection';

    if (pc == null) { // move current locked
        if (locked == null) {
            // do toast: need to change the piece first
        } else {
            let spc = locked.piece;
            // TODO: ensure that piece signal is different from changed signal (iframe messaging)
            voidMoves(getPossibleMoves(spc.positionLetterIndex, spc.positionNumber, bsqs));
            bsq.piece = spc;
            locked.piece = null;
            // locked.isBlackSelected = false;
            locked.isDisturbed = false;
            locked.nativeElement.querySelector('.piece').classList.remove('disturbed');
            locked.nativeElement.querySelector('.piece').classList.remove(selclass);

            updateSquarePair(bsq, locked, isSimpleMode);

            // bsq.isBlackSelected = true;
            selection = bsq;
            pelem.classList.add(selclass);
            locked = null;
            isBlackTurn = !isBlackTurn;
        }
    } else {
        if (selection != null) {
            let spc = selection.piece;

            if (spc.isBlack === isBlackTurn) {
                removeFocus(selection, selclass, bsqs);
            } else {
                selection.nativeElement.querySelector('.piece').classList.remove(selclass);
            }

            if (spc.positionLetterIndex === l && spc.positionNumber === pn) {
                return {
                    selection: null,
                    locked: locked,
                    isBlackTurn: isBlackTurn
                }
            }
        }

        // bsq.isBlackSelected = true;
        selection = bsq;
        pelem.classList.add(selclass);
        if (bsq.piece.isBlack == isBlackTurn && locked == null)
            enableMoves(getPossibleMoves(l,pn,bsqs));
    }

    // TODO: update piece viewer OR activate color pickers
    // send message to iframes

    return {
        selection: selection,
        locked: locked,
        isBlackTurn: isBlackTurn,
    }
}

let enableMoves = (bsqs: BoardSquare[])=> {
    bsqs.forEach((bsq)=> {
        let ta = bsq.nativeElement.querySelector('.touch-area');
        ta.removeAttribute(DISABLED_ATTRIB);
        ta.classList.add('possible-move');
    });
}

let voidMoves = (bsqs: BoardSquare[])=> {
    bsqs.forEach((bsq)=> {
        let ta = bsq.nativeElement.querySelector('.touch-area');
        ta.setAttribute(DISABLED_ATTRIB, 'true');
        ta.classList.remove('possible-move');
    });
}

// Be sure to remove focus before moving a piece finally
let removeFocus = (bsq: BoardSquare, selclass: string, bsqs: BoardSquare[])=> {
    let pelem = bsq.nativeElement.querySelector('.piece'),
        pc = bsq.piece;
    pelem.classList.remove(selclass);
    voidMoves(getPossibleMoves(pc.positionLetterIndex, pc.positionNumber, bsqs));
}

// TODO: Before loading a saved game, use the coordinates of pieces to retrieve
// BoardSquare DOMElements to construct BoardSquare object array for this function.
let setupBoard = (boardSquares: BoardSquare[], isSimpleMode: boolean, isNewGame: boolean)=> {

    if (isNewGame) {
        for (let i = 0; i < 6; i++) {
            boardSquares[i].piece = new Piece(false, i%6, null, null);
            boardSquares[i+12].piece = new Piece(false, 5-i%6, null, null);
            boardSquares[i+18].piece = new Piece(true, i%6, null, null);
            boardSquares[i+30].piece = new Piece(true, 5-i%6, null, null);
        }
    }

    if (!isSimpleMode) {
        document.querySelector('.black.piece.signal').setAttribute(ADJUSTABLE_ATTRIB, "true");
        document.querySelector('.white.piece.signal').setAttribute(ADJUSTABLE_ATTRIB, "true");
    }

    for (let i = 0; i < boardSquares.length; i++) {
        let bsq = boardSquares[i],
            p = bsq.piece,
            pc = bsq.nativeElement.querySelector('.piece'),
            pcb = bsq.nativeElement.querySelector('.touch-area');
        if (p) {
            let side = p.isBlack ? BLACK_PROP : WHITE_PROP,
                color = isSimpleMode ? pieceColors[p.colorIndex] : side;
            pc.setAttribute(PIECE_SIDE_ATTRIB, side);
            pc.setAttribute(PIECE_COLOR_ATTRIB, color);
            pcb.removeAttribute(DISABLED_ATTRIB);
            p.positionLetterIndex = parseInt(bsq.nativeElement.getAttribute(LETTER_INDEX_ATTRIB));
            p.positionNumber = parseInt(bsq.nativeElement.getAttribute(POSITION_NUMBER_ATTRIB));
        } else {
            pc.removeAttribute(PIECE_SIDE_ATTRIB);
            pc.removeAttribute(PIECE_COLOR_ATTRIB);
            pcb.setAttribute(DISABLED_ATTRIB, 'true');
        }
    };

    return boardSquares;
}

let updateSquarePair = (nbsq: BoardSquare, obsq: BoardSquare, isSimpleMode: boolean)=> {
    let p = obsq.piece,
        npc = nbsq.nativeElement.querySelector('.piece'),
        npcb = nbsq.nativeElement.querySelector('.touch-area'),
        opc = obsq.nativeElement.querySelector('.piece'),
        opcb = obsq.nativeElement.querySelector('.touch-area');

    let side = p.isBlack ? BLACK_PROP : WHITE_PROP,
        color = isSimpleMode ? pieceColors[p.colorIndex] : side;
    npc.setAttribute(PIECE_SIDE_ATTRIB, side);
    npc.setAttribute(PIECE_COLOR_ATTRIB, color);
    npcb.removeAttribute(DISABLED_ATTRIB);
    p.positionLetterIndex = parseInt(nbsq.nativeElement.getAttribute(LETTER_INDEX_ATTRIB));
    p.positionNumber = parseInt(nbsq.nativeElement.getAttribute(POSITION_NUMBER_ATTRIB));

    opc.removeAttribute(PIECE_SIDE_ATTRIB);
    opc.removeAttribute(PIECE_COLOR_ATTRIB);
    opcb.setAttribute(DISABLED_ATTRIB, 'true');
}

let getPossibleMoves = (positionLetterIndex: number, positionNumber: number, bsqs: BoardSquare[])=> {
    let psbsqs = [], psbsqs_ = [],
        prevl = positionLetterIndex-1,
        nextl = positionLetterIndex+1,
        prevn = positionNumber-1,
        nextn = positionNumber+1;
    if (prevl >= 0) {
        psbsqs_.push(bsqs[coordsToBoardIndex(prevl,positionNumber)]); // left
        if (prevn >= 0) psbsqs_.push(bsqs[coordsToBoardIndex(prevl,prevn)]); // bottom-left
        if (nextn < 6) psbsqs_.push(bsqs[coordsToBoardIndex(prevl,nextn)]); // top-left
    }
    if (nextl < 6) {
        psbsqs_.push(bsqs[coordsToBoardIndex(nextl,positionNumber)]); // right
        if (prevn >= 0) psbsqs_.push(bsqs[coordsToBoardIndex(nextl,prevn)]); // bottom-right
        if (nextn < 6) psbsqs_.push(bsqs[coordsToBoardIndex(nextl,nextn)]); // top-right
    }
    if (prevn >= 0) psbsqs_.push(bsqs[coordsToBoardIndex(positionLetterIndex,prevn)]); // up
    if (nextn < 6) psbsqs_.push(bsqs[coordsToBoardIndex(positionLetterIndex,nextn)]); // down

    psbsqs_.forEach((psbsq)=> {
        if (psbsq.piece == null) psbsqs.push(psbsq);
    });

    return psbsqs;
}

let coordsToBoardIndex = (positionLetterIndex: number, positionNumber: number)=> {
    return 5*(5-positionNumber)+(5-positionNumber)+positionLetterIndex;
}

let gatherBoardSquares = ()=> {
    let bsqs = [];
    let bsqs_ = document.getElementsByClassName('square playable');
    for (let i = 0; i < bsqs_.length; i++) {
        bsqs.push(new BoardSquare(null,bsqs_[i],false,false,false));
    }

    return bsqs;
}

class Piece {
    isBlack: boolean;
    colorIndex: number; // from `pieceColors`
    positionLetterIndex: number;
    positionNumber: number;
    signal: number[];

    constructor(isBlack: boolean, colorIndex: number, positionLetterIndex: number, positionNumber: number) {
        this.isBlack = isBlack;
        this.colorIndex = colorIndex;
        this.positionLetterIndex = positionLetterIndex;
        this.positionNumber = positionNumber;
        let signal = [];
        for (let i = 0; i < 6; i++) { signal.push(0.0000001); }
        this.signal = signal;
    }
}

let pieceColors = ["red","green","orange","blue","yellow","purple"];

class BoardSquare {
    piece: Piece;
    nativeElement: Element;
    isBlackSelected: boolean;
    isWhiteSelected: boolean;
    isDisturbed: boolean;

    constructor(piece: Piece, nativeElement: Element, isBlackSelected: boolean, isWhiteSelected: boolean, isDisturbed: boolean) {
        this.piece = piece;
        this.nativeElement = nativeElement;
        this.isBlackSelected = isBlackSelected;
        this.isWhiteSelected = isWhiteSelected;
        this.isDisturbed = isDisturbed;
    }
}

let LETTER_INDEX_ATTRIB = 'letterIndex',
    POSITION_NUMBER_ATTRIB = 'number',
    PIECE_SIDE_ATTRIB = 'pieceSide',
    PIECE_COLOR_ATTRIB = 'pieceColor',
    DISABLED_ATTRIB = 'disabled',
    ADJUSTABLE_ATTRIB = 'adjustable';
let BLACK_PROP = 'black',
    WHITE_PROP = 'white';
