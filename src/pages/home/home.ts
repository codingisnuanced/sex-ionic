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

    constructor(public menu: MenuController) {
        menu.enable(true);
    }

    ngAfterViewInit() {
        // TODO: particlesJS config should be loaded with consideration of screen size
        window['particlesJS'].load('page-home-content', 'assets/config/particles.json', function() {
            console.log('callback - particles.js config loaded');
        });
        let bsqs = gatherBoardSquares();
        this.boardSquares = setupBoard(bsqs, this.isSimpleMode);
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
    //             renderSquarePair(bsq,this.blackLocked, this.isSimpleMode);
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
        let p = e.target.parentNode;
        if (this.isBlackTurn) {
            p.classList.add('white-selection');
        } else {
            p.classList.add('black-selection');
        }
        document.querySelector('.error-log').textContent = p.outerHTML;
    }
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
        let spc = locked.piece;
        voidMoves(getPossibleMoves(spc.positionLetterIndex, spc.positionNumber, bsqs));
        bsq.piece = spc;
        locked.piece = null;
        // locked.isBlackSelected = false;
        locked.isDisturbed = false;
        locked.nativeElement.querySelector('.piece').classList.remove('disturbed');
        locked.nativeElement.querySelector('.piece').classList.remove(selclass);

        renderSquarePair(bsq, locked, isSimpleMode);

        // bsq.isBlackSelected = true;
        selection = bsq;
        pelem.classList.add(selclass);
        locked = null;
        isBlackTurn = !isBlackTurn;
    } else {
        if (selection != null) {
            if (selection.piece.isBlack === isBlackTurn) {
                removeFocus(selection, selclass, bsqs);
            } else {
                selection.nativeElement.querySelector('.piece').classList.remove(selclass);
            }
        }

        // bsq.isBlackSelected = true;
        selection = bsq;
        pelem.classList.add(selclass);
        if (bsq.piece.isBlack == isBlackTurn && locked == null)
            enableMoves(getPossibleMoves(l,pn,bsqs));
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

let setupBoard = (boardSquares: BoardSquare[], isSimpleMode: boolean)=> {
    for (let i = 0; i < 6; i++) {
        boardSquares[i].piece = new Piece(false, i%6, null, null);
        boardSquares[i+12].piece = new Piece(false, 5-i%6, null, null);
        boardSquares[i+18].piece = new Piece(true, i%6, null, null);
        boardSquares[i+30].piece = new Piece(true, 5-i%6, null, null);
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

let renderSquarePair = (nbsq: BoardSquare, obsq: BoardSquare, isSimpleMode: boolean)=> {
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

    constructor(isBlack: boolean, colorIndex: number, positionLetterIndex: number, positionNumber: number) {
        this.isBlack = isBlack;
        this.colorIndex = colorIndex;
        this.positionLetterIndex = positionLetterIndex;
        this.positionNumber = positionNumber;
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
    DISABLED_ATTRIB = 'disabled';
let BLACK_PROP = 'black',
    WHITE_PROP = 'white';
