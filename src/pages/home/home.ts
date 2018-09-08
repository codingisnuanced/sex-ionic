import { Component } from '@angular/core';
import { MenuController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

    boardSquares: BoardSquare[]; // [BoardSquare]
    isSimpleMode: boolean = false;
    isBlackTurn: boolean = true;
    blackSelection: BoardSquare; // BoardSquare
    whiteSelection: BoardSquare; // BoardSquare
    blackLocked: BoardSquare; // BoardSquare
    whiteLocked: BoardSquare; // BoardSquare
    blackSignal: number[] = [0.5,0.5,0.5,0.5,0.5,0.5];
    whiteSignal: number[] = [0.5,0.5,0.5,0.5,0.5,0.5];
    targetSignal: number[];
    prevColorIndex: number;
    prevSignal: number[];

    constructor(public menu: MenuController) {
        menu.enable(true);

        this.targetSignal = [Math.random(),Math.random(),Math.random(),Math.random(),Math.random(),Math.random()];
    }

    ngAfterViewInit() {
        // TODO: particlesJS config should be loaded with consideration of screen size
        window['particlesJS'].load('page-home-content', 'assets/config/particles.json', ()=> {
            console.log('callback - particles.js config loaded');
        });

        window.addEventListener('message', (e)=> {
            if (e.data.frameReady) {
                let sel = '.'+e.data.side+' .'+e.data.signalType+'.signal iframe',
                    frame : HTMLFrameElement = document.querySelector(sel),
                    sig_t = null,
                    opts = null;
                switch (e.data.signalType) {
                    case 'target':
                        sig_t = this.targetSignal.map(x=>''+Math.round(x*100)/100),
                        opts = {
                            labels: sig_t,
                            data:  this.targetSignal,
                            dragData: false
                        }
                        break;
                    case 'score':
                        let scsig = e.data.side === 'black' ? this.blackSignal : this.whiteSignal;
                        sig_t = scsig.map(x=>''+Math.round(x*100)/100),
                        opts = {
                            labels: sig_t,
                            data:  scsig,
                            dragData: false
                        }
                        break;
                    default:
                        return;
                }

                frame.contentWindow.postMessage(opts, "*");

                return;
            }

            let sel = this.isBlackTurn ? this.blackSelection : this.whiteSelection;
            processSignalChange(e.data.index, e.data.value, sel, this.targetSignal, e.data.isStart, e.data.isEnd);
        });

        this.boardSquares = setupBoard(gatherBoardSquares(), this.isSimpleMode, this.isBlackTurn, this.targetSignal, true);
    }

    pieceTap(e) {
        let res;
        if(this.isBlackTurn) {
            res = processPieceTap(e, this.boardSquares, this.blackSelection, this.blackLocked, this.isSimpleMode, this.isBlackTurn, this.targetSignal);
            this.blackSelection = res.selection;
            this.blackLocked = res.locked;
            this.isBlackTurn = res.isBlackTurn;
        } else {
            res = processPieceTap(e, this.boardSquares, this.whiteSelection, this.whiteLocked, this.isSimpleMode, this.isBlackTurn, this.targetSignal);
            this.whiteSelection = res.selection;
            this.whiteLocked = res.locked;
            this.isBlackTurn = res.isBlackTurn;
        }

        if (res.didMove) {
            this.prevColorIndex = this.prevSignal = null;

            if (this.isBlackTurn) {
                document.querySelector('.turns-taken .black').classList.add('current-turn');
                document.querySelector('.turns-taken .white').classList.remove('current-turn');
            } else {
                document.querySelector('.turns-taken .white').classList.add('current-turn');
                document.querySelector('.turns-taken .black').classList.remove('current-turn');
            }

            if (this.isSimpleMode) {
                if (this.isBlackTurn && this.blackSelection != null) {
                    let pckrs = document.getElementsByClassName('black color-picker');
                    Array.prototype.forEach.call(pckrs, pckr=> {
                        pckr.classList.add('color-picker-active');
                        pckr.querySelector('button').removeAttribute(DISABLED_ATTRIB);
                    });
                    pckrs[this.blackSelection.piece.colorIndex].querySelector('button').classList.add('selected');
                    enableMoves(getPossibleMoves(this.blackSelection.piece.positionLetterIndex,this.blackSelection.piece.positionNumber,this.boardSquares));
                } else if (this.isBlackTurn === false && this.whiteSelection != null) {
                    let pckrs = document.getElementsByClassName('white color-picker');
                    Array.prototype.forEach.call(pckrs, pckr=> {
                        pckr.classList.add('color-picker-active');
                        pckr.querySelector('button').removeAttribute(DISABLED_ATTRIB);
                    });
                    pckrs[5-this.whiteSelection.piece.colorIndex].querySelector('button').classList.add('selected');
                    enableMoves(getPossibleMoves(this.whiteSelection.piece.positionLetterIndex,this.whiteSelection.piece.positionNumber,this.boardSquares));
                }
            } else {
                // TODO: show current selection's signal if there is one
                let sel = this.isBlackTurn ? this.blackSelection : this.whiteSelection;
                if (sel != null) {
                    let side = this.isBlackTurn ? 'black' : 'white',
                        sigc = document.querySelector('.'+side+'.signals-container'),
                        psig = sigc.querySelector('.piece.signal'),
                        sigframe = psig.querySelector('iframe'),
                        sig = sel.piece.signal,
                        sig_t = sig.map(x=>''+Math.round(x*100)/100),
                        opts = {
                            labels: sig_t,
                            data:  sig,
                            dragData: true
                        }

                    sigframe.contentWindow.postMessage(opts, "*");

                    sigc.classList.add('piece-active');

                    psig.querySelector('.name').textContent = ''+positionLetters[sel.piece.positionLetterIndex]+sel.piece.positionNumber;
                    psig.querySelector('.correlation-score').textContent = ''+Math.round(calculateCorrelation(sig,this.targetSignal,true,true,false)*1e20)/1e18;
                }
            }
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

        if (ci === this.prevColorIndex) {
            // TODO: show toast saying color must change because piece was disturbed
        }

        if (this.isBlackTurn) {
            this.blackLocked = locked = this.blackSelection;
        } else {
            this.whiteLocked = locked = this.whiteSelection;
        }

        if (this.prevColorIndex == null) this.prevColorIndex = oci;

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
    let spc = selection.piece,
        signal = spc.signal;
    signal[index] = value;
    // calculate correlation score
    let corr = calculateCorrelation(signal,targetSignal,true,true,false);
    // update piece viewer and signal correlation score
    let side = spc.isBlack ? 'black' : 'white',
        psig = document.querySelector('.'+side+' .piece.signal'),
        pvwr = document.querySelector('.'+side+'.piece-viewer'),
        pclrasp = pvwr.querySelector('.color-aspect'),
        pcam = pvwr.querySelector('.color-aspect-amount'),
        letter = positionLetters[spc.positionLetterIndex],
        number = spc.positionNumber,
        sclr = pieceSimpleColors[index];
    if (isStart) {
        pvwr.classList.add('active');
        psig.querySelector('div:first-child').classList.add('changing');
    }
    pclrasp.setAttribute(ASPECT_COLOR_ATTRIB, sclr);
    pclrasp.querySelector('span').textContent = ''+letter+number;
    pcam.querySelector('span').textContent = ''+Math.round(value*1e18)/1e18;
    psig.querySelector('.correlation-score').textContent = ''+Math.round(corr*1e20)/1e18;
    // TODO: use selection.isBlackSelected && selection.isWhiteSelected to determine
    // which iframes should be updated
    if (isEnd) {
        pvwr.classList.remove('active');
        psig.querySelector('div:first-child').classList.remove('changing');
    }
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

let processPieceTap = (e, bsqs: BoardSquare[], selection: BoardSquare, locked: BoardSquare, isSimpleMode: boolean, isBlackTurn: boolean, targetSignal: number[])=> {
    let pelem = e.target.parentNode,
        bsqelem = pelem.parentNode.parentNode,
        l = parseInt(bsqelem.getAttribute(LETTER_INDEX_ATTRIB)),
        pn = parseInt(bsqelem.getAttribute(POSITION_NUMBER_ATTRIB)),
        bsq = bsqs[coordsToBoardIndex(l,pn)],
        pc = bsq.piece,
        selclass = isBlackTurn ? 'black-selection' : 'white-selection',
        side = isBlackTurn ? 'black' : 'white',
        didMove = false;

    if (pc == null) { // move current locked
        if (locked == null) {
            // TODO: do toast: need to change the piece first
        } else {
            let spc = locked.piece;
            // TODO:
            // if simple, ensure prev color index is different from
            // if complex, ensure that piece signal is different from changed signal (iframe messaging)
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
            didMove = true;

            alternatePieceState(bsqs,isBlackTurn);
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
                } else {
                    pckrs[5-spc.colorIndex].querySelector('button').classList.add('selected');
                }
            }
        } else {
            let side = isBlackTurn ? 'black' : 'white',
                sigc = document.querySelector('.'+side+'.signals-container'),
                psig = sigc.querySelector('.piece.signal'),
                sigframe = psig.querySelector('iframe'),
                sig = spc.signal,
                sig_t = sig.map(x=>''+Math.round(x*100)/100),
                opts = {
                    labels: sig_t,
                    data:  sig,
                    dragData: spc.isBlack === isBlackTurn
                }

            sigframe.contentWindow.postMessage(opts, "*");

            sigc.classList.add('piece-active');

            psig.querySelector('.name').textContent = ''+positionLetters[spc.positionLetterIndex]+spc.positionNumber;
            psig.querySelector('.correlation-score').textContent = ''+Math.round(calculateCorrelation(sig,targetSignal,true,true,false)*1e20)/1e18;
        }
    }

    return {
        selection: selection,
        locked: locked,
        isBlackTurn: isBlackTurn,
        didMove: didMove
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
let setupBoard = (boardSquares: BoardSquare[], isSimpleMode: boolean, isBlackTurn: boolean, targetSignal: number[], isNewGame: boolean)=> {

    if (isNewGame) {
        for (let i = 0; i < 6; i++) {
            boardSquares[i].piece = new Piece(false, i%6, null, null);
            boardSquares[i+12].piece = new Piece(false, 5-i%6, null, null);
            boardSquares[i+18].piece = new Piece(true, i%6, null, null);
            boardSquares[i+30].piece = new Piece(true, 5-i%6, null, null);
        }

        if (isBlackTurn) {
            document.querySelector('.turns-taken .black').classList.add('current-turn');
        } else {
            document.querySelector('.turns-taken .white').classList.add('current-turn');
        }
    }

    Array.prototype.forEach.call(document.getElementsByClassName('target signal'), (tsig)=> {
        let sigframe = tsig.querySelector('iframe'),
            sig_t = targetSignal.map(x=>''+Math.round(x*100)/100),
            opts = {
                labels: sig_t,
                data:  targetSignal,
                dragData: false
            }

        sigframe.contentWindow.postMessage(opts, "*");
    });

    for (let i = 0; i < boardSquares.length; i++) {
        let bsq = boardSquares[i],
            p = bsq.piece,
            pelem = bsq.nativeElement.querySelector('.piece'),
            pelemb = bsq.nativeElement.querySelector('.touch-area');
        if (p != null) {
            let side = p.isBlack ? BLACK_PROP : WHITE_PROP,
                color = isSimpleMode ? pieceSimpleColors[p.colorIndex] : side;
            pelem.setAttribute(PIECE_SIDE_ATTRIB, side);
            pelem.setAttribute(PIECE_COLOR_ATTRIB, color);
            pelemb.removeAttribute(DISABLED_ATTRIB);
            p.positionLetterIndex = parseInt(bsq.nativeElement.getAttribute(LETTER_INDEX_ATTRIB));
            p.positionNumber = parseInt(bsq.nativeElement.getAttribute(POSITION_NUMBER_ATTRIB));

            if (p.isBlack === isBlackTurn) {
                pelem.classList.add('woke');
            } else {
                pelem.classList.remove('woke');
            }
        } else {
            pelem.removeAttribute(PIECE_SIDE_ATTRIB);
            pelem.removeAttribute(PIECE_COLOR_ATTRIB);
            pelemb.setAttribute(DISABLED_ATTRIB, 'true');
        }
    };

    return boardSquares;
}

let alternatePieceState = (bsqs: BoardSquare[], isBlackTurn: boolean)=> {
    bsqs.forEach((bsq)=> {
        if (bsq.piece != null && bsq.piece.isBlack === isBlackTurn) {
            bsq.nativeElement.querySelector('.piece').classList.add('woke');
            return;
        }

        bsq.nativeElement.querySelector('.piece').classList.remove('woke');
    });
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
