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

    colorPickerTap(e) {
        let locked: BoardSquare,
            side = this.isBlackTurn ? 'black' : 'white',
            oselc = document.querySelector('.'+side+'.color-picker button.selected'),
            oci = pieceSimpleColors.indexOf(oselc.parentElement.parentElement.getAttribute(PIECE_COLOR_ATTRIB)),
            c = e.target.parentNode.parentNode.getAttribute(PIECE_COLOR_ATTRIB),
            ci = pieceSimpleColors.indexOf(c);

        if (oci === ci) {
            // TODO: show toast saying color must be different
            return;
        }

        if (this.isBlackTurn) {
            this.blackLocked = locked = this.blackSelection;
        } else {
            this.whiteLocked = locked = this.whiteSelection;
        }

        locked.isDisturbed = true;
        locked.nativeElement.querySelector('.piece').classList.add('disturbed');

        // remove focus from current color picker
        oselc.classList.remove('selected');

        // select new color picker
        e.target.classList.add('selected');
        locked.piece.colorIndex = ci;
        locked.nativeElement.querySelector('.piece').setAttribute(PIECE_COLOR_ATTRIB, c);
    }
}

// applies to only complex mode
let processSignalChange = (index: number, value: number, selection: BoardSquare, targetSignal: number[], isStart: boolean, isEnd: boolean)=> {
    // update piece signal
    let signal = selection.piece.signal;
    signal[index] = value;
    // calculate correlation score
    let corr = calculateCorrelation(signal,targetSignal,true,true,false);
    // update piece viewer and signal correlation score
    let side = selection.piece.isBlack ? 'black' : 'white';
    let pvwr = document.querySelector('.'+side+'.piece-viewer'),
        pclrasp = pvwr.querySelector('color-aspect'),
        pcam = pvwr.querySelector('color-aspect-amount'),
        letter = positionLetters[selection.piece.positionLetterIndex],
        number = selection.piece.positionNumber,
        sclr = pieceSimpleColors[selection.piece.colorIndex];
    if (isStart) pvwr.classList.add('active');
    pclrasp.setAttribute(ASPECT_COLOR_ATTRIB, sclr);
    pclrasp.querySelector('span').textContent = ''+letter+number;
    pcam.querySelector('span').textContent = value.toFixed(18);
    if (isEnd) pvwr.classList.remove('active');
    // return updated board square (?)
    return selection;
}

let calculateCorrelation = (sig: number[], tsig: number[], diversityIsRelative: boolean, useDistance: boolean, shouldNormalize: boolean)=> {
    let g = [], gavgs = [], sum = 0,
        signal = sig.slice(0,sig.length),
        targetSignal = tsig.slice(0,tsig.length);
    if (shouldNormalize) {signal=normalize(signal); targetSignal=normalize(targetSignal);}

    for (let i = 0; i < signal.length; i++) {
        let g_ = [];
        for (let j = 0; j < signal.length; j++) {
            g_.push(0);
        }
        g.push(g_);
        gavgs.push(0);
    }

    for (let i = 0; i < signal.length; i++) {
        for (let j = i+1; j < signal.length; j++) {
            let diff = 0;
            if (useDistance) {
                diff = Math.abs((signal[i]-signal[j])-(targetSignal[i]-targetSignal[j]))/Math.abs(i-j);
            } else {
                diff = Math.abs((signal[i]-signal[j])-(targetSignal[i]-targetSignal[j]));
            }
            g[i][j] = g[j][i] = diff;
        }
        gavgs[i] = g[i].reduce((t,n)=> t+n)/(signal.length-1);
        sum+=g[i].reduce((t,n)=> t+n);
    }
    let progDivDiff = 0;
    if (diversityIsRelative) {
        progDivDiff = sum/(signal.length*(signal.length-1)/2);
    } else {
        progDivDiff = gavgs.reduce((t,n)=>t+n)/signal.length;
    }
    let corr = 1-Math.abs(progDivDiff);
    return Math.max(0,Math.min(1,corr));
}

let perms = (signal: number[])=> {
    let ps = [];

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
        selclass = isBlackTurn ? 'black-selection' : 'white-selection',
        side = isBlackTurn ? 'black' : 'white';

    if (pc == null) { // move current locked
        if (locked == null) {
            // TODO: do toast: need to change the piece first
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

            if (isSimpleMode) {
                let oselc = document.querySelector('.'+side+'.color-picker button.selected');
                if (oselc != null) oselc.classList.remove('selected');

                let pckrs = document.getElementsByClassName(side+' color-picker');
                Array.prototype.forEach.call(pckrs, pckr=>{
                    pckr.classList.remove('color-picker-active');
                    pckr.querySelector('button').setAttribute(DISABLED_ATTRIB, 'true');
                });

                // TODO: activate the other side's pickers if piece is selected
            } else {
                // TODO: activate the other side's piece signal if piece is selected
            }

            // bsq.isBlackSelected = true;
            selection = bsq;
            pelem.classList.add(selclass);
            locked = null;
            isBlackTurn = !isBlackTurn;
        }
    } else {
        if (selection != null) {
            let spc = selection.piece;

            if (spc.isBlack === isBlackTurn) { // due side tapped own piece
                removeFocus(selection, selclass, bsqs);

            } else { // due side tapped opponent piece
                selection.nativeElement.querySelector('.piece').classList.remove(selclass);
            }

            if (isSimpleMode) {
                let pckrs = document.getElementsByClassName(side+' color-picker');
                Array.prototype.forEach.call(pckrs, pckr=>{
                    pckr.classList.remove('color-picker-active');
                    pckr.querySelector('button').setAttribute(DISABLED_ATTRIB, 'true');
                });
                let oselc = document.querySelector('.'+side+'.color-picker button.selected');
                if (oselc != null) oselc.classList.remove('selected');
            } else {
                // TODO: hide/turn off piece signal
            }

            // current selection is the same as what was tapped; remove focus
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
        if (bsq.piece.isBlack == isBlackTurn && (locked == null || (locked.piece.positionLetterIndex === l && locked.piece.positionNumber === pn)))
            enableMoves(getPossibleMoves(l,pn,bsqs));

        let spc = selection.piece;
        if (isSimpleMode) {
            if (spc.isBlack === isBlackTurn && (locked == null || (locked.piece.positionLetterIndex === l && locked.piece.positionNumber === pn))) {
                let pckrs = document.getElementsByClassName(side+' color-picker');
                Array.prototype.forEach.call(pckrs, pckr=> {
                    pckr.classList.add('color-picker-active');
                    pckr.querySelector('button').removeAttribute(DISABLED_ATTRIB);
                });
                if (spc.isBlack) {
                    pckrs[spc.colorIndex].querySelector('button').classList.add('selected');
                    // pckrs[spc.colorIndex].setAttribute(DISABLED_ATTRIB, 'true');
                } else {
                    pckrs[5-spc.colorIndex].querySelector('button').classList.add('selected');
                    // pckrs[5-spc.colorIndex].setAttribute(DISABLED_ATTRIB, 'true');
            }
        }
        } else {
            // TODO: send message to piece signal iframe; show/activate it
        }
    }

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
                color = isSimpleMode ? pieceSimpleColors[p.colorIndex] : side;
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
    let p = nbsq.piece,
        npc = nbsq.nativeElement.querySelector('.piece'),
        npcb = nbsq.nativeElement.querySelector('.touch-area'),
        opc = obsq.nativeElement.querySelector('.piece'),
        opcb = obsq.nativeElement.querySelector('.touch-area');

    let side = p.isBlack ? BLACK_PROP : WHITE_PROP,
        color = isSimpleMode ? pieceSimpleColors[p.colorIndex] : side;
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
    colorIndex: number; // from `pieceSimpleColors`
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

let pieceSimpleColors = ["red","green","orange","blue","yellow","purple"],
    // pieceColors = ['Red','MediumSpringGreen','Orange','DodgerBlue','Yellow','Fuchsia'],
    positionLetters = ['A','B','C','D','E','F'];

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
    ASPECT_COLOR_ATTRIB = 'aspectColor',
    DISABLED_ATTRIB = 'disabled',
    ADJUSTABLE_ATTRIB = 'adjustable';
let BLACK_PROP = 'black',
    WHITE_PROP = 'white';
