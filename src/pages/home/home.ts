import { Component } from '@angular/core';
import { Events, MenuController, Platform, ToastController } from 'ionic-angular';
import { Storage } from "@ionic/storage";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class SexGame {

    boardSquares: BoardSquare[];
    isSimpleMode: boolean = true;
    isBlackTurn: boolean = true;
    blackSelection: BoardSquare;
    whiteSelection: BoardSquare;
    blackLocked: BoardSquare;
    whiteLocked: BoardSquare;
    blackSignal: Process[];
    whiteSignal: Process[];
    targetSignal: number[];
    prevColorIndex: number;
    prevSignal: number[];
    lastSaveDate: number;
    name: string = '';
    id: string;

    constructor(public platform: Platform, public menu: MenuController, private toastCtrl: ToastController, public events: Events, private storage: Storage) {
        menu.enable(true);

        events.subscribe('game:save', (name: string)=> {
            this.name = name;
            this.save(null, true);
        });

        events.subscribe('game:load', (gs: GameState, id: string)=> {
            this.load(gs,id);
            menu.close();
        });

        events.subscribe('game:new', (isSimpleMode: boolean)=> {
            this.reset(isSimpleMode);
            menu.close();
        });

        events.subscribe('game:nameChange', (name:string)=> {
            this.name = name;
        });

        events.subscribe('game:share', ()=> {
            this.share(null);
        });
    }

    ngAfterViewInit() {

        this.reset(this.isSimpleMode);

        window.addEventListener('message', (e)=> {
            if (e.data.frameReady) {
                let sel = '.'+e.data.side+' .'+e.data.signalType+'.signal iframe',
                    frame : HTMLFrameElement = document.querySelector(sel),
                    sig_t = null,
                    opts = null;
                switch (e.data.signalType) {
                    case 'target':
                        sig_t = this.targetSignal.map(x =>''+(Math.round(x*100)/100)),
                        opts = {
                            labels: sig_t,
                            data:  this.targetSignal,
                            dragData: false
                        }
                        break;
                    case 'score':
                        let scsig = e.data.side === 'black' ? stripSignal(this.blackSignal) : stripSignal(this.whiteSignal);
                        sig_t = scsig.map(x =>''+(Math.round(x*100)/100)),
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

            let locked : BoardSquare = null;
            if (this.isBlackTurn) {
                locked = this.blackLocked = this.blackSelection;
            } else {
                locked = this.whiteLocked = this.whiteSelection;
            }
            locked.nativeElement.querySelector('.piece').classList.add('disturbed');
            let isBothSelection = false;
            if (this.blackSelection != null && this.whiteSelection != null) {
                let bp = this.blackSelection.piece,
                    wp = this.whiteSelection.piece;
                isBothSelection = bp.positionLetterIndex === wp.positionLetterIndex && bp.positionNumber === wp.positionNumber;
            }
            if (this.prevSignal == null) this.prevSignal = locked.piece.signal.slice(0,locked.piece.signal.length);
            signalChange_(e.data.index, e.data.value, locked, this.targetSignal, e.data.isStart, e.data.isEnd, isBothSelection);
        });

        let pjscfg = 'mobile';
        if (this.platform.is('core') || this.platform.is('tablet')) pjscfg = 'desktop';
        window['particlesJS'].load('page-home-content', 'assets/config/'+pjscfg+'_particles.json', ()=> {});
    }

    reset(isSimpleMode: boolean) {
        this.isSimpleMode = isSimpleMode;
        this.isBlackTurn = true;
        this.blackSelection = this.whiteSelection = null;
        this.blackLocked = this.whiteLocked = null;
        this.prevSignal = this.prevColorIndex = null;
        this.lastSaveDate = null;
        this.name = '';
        this.id = generateUUID();

        let t = document.querySelector('.turns-taken');

        t.querySelector('.black span').textContent = '1'
        t.classList.add('current-turn');

        t.querySelector('.white span').textContent = '0';
        t.classList.remove('current-turn');

        this.targetSignal = [Math.random(),Math.random(),Math.random(),Math.random(),Math.random(),Math.random()];
        this.blackSignal = [];
        this.whiteSignal = [];
        for (let i = 0; i < this.targetSignal.length; i++) {
            this.whiteSignal.push(new Process(0.5));
            this.blackSignal.push(new Process(0.5));
        }

        setScoreSignal(true, this.blackSignal, this.targetSignal);
        setScoreSignal(false, this.whiteSignal, this.targetSignal);

        resetColorPickers(true);
        resetColorPickers(false);

        resetPieceSignals(true);
        resetPieceSignals(false);

        this.boardSquares = gatherBoardSquares();
        setupBoard(this.boardSquares, this.isSimpleMode, this.isBlackTurn, this.targetSignal, null);
    }

    load(gs: GameState, id: string) {
        this.isSimpleMode = gs.isSimpleMode;
        this.isBlackTurn = gs.isBlackTurn;
        this.blackSelection = this.whiteSelection = null;
        this.targetSignal = gs.targetSignal;
        this.blackSignal = gs.blackSignal.map(gproc => {
            let proc = new Process(gproc.value);
            proc.times = gproc.times;
            proc.total = gproc.total;
            return proc;
        });
        this.whiteSignal = gs.whiteSignal.map(gproc => {
            let proc = new Process(gproc.value);
            proc.times = gproc.times;
            proc.total = gproc.total;
            return proc;
        });
        this.prevColorIndex = gs.prevColorIndex;
        this.prevSignal = gs.prevSignal;
        this.name = gs.name;
        this.id = id;

        this.boardSquares = gatherBoardSquares();
        setupBoard(this.boardSquares, this.isSimpleMode, this.isBlackTurn, this.targetSignal, gs.boardSquares);

        let bsq: BoardSquare = null;
        if (gs.blackLocked > -1) {
            bsq = this.boardSquares[gs.blackLocked];
            bsq.nativeElement.querySelector('.piece').classList.add('disturbed');
            this.blackLocked = bsq;
        }
        if (gs.whiteLocked > -1) {
            bsq = this.boardSquares[gs.whiteLocked];
            bsq.nativeElement.querySelector('.piece').classList.add('disturbed');
            this.whiteLocked = bsq;
        }

        let t = document.querySelector('.turns-taken');

        t.querySelector('.black span').textContent = gs.blackTurnsTaken.toString();
        t.querySelector('.white span').textContent = gs.whiteTurnsTaken.toString();

        setScoreSignal(true, this.blackSignal, this.targetSignal);
        setScoreSignal(false, this.whiteSignal, this.targetSignal);

        resetColorPickers(true);
        resetColorPickers(false);

        resetPieceSignals(true);
        resetPieceSignals(false);

        let type = this.isSimpleMode ? 'Simple' : 'Complex';
        let name = this.name === '' ? 'on '+formatDate(new Date(gs.lastSaveDate)) : 'with '+this.name;
        let toast = this.toastCtrl.create({
            message: 'Loaded '+type+' Sex '+name,
            duration: 3000,
            position: 'bottom',
            cssClass: 'sexapp-game'
        });
        toast.present();

        this.save(null, false);

        this.events.publish('game:loaded', this.isSimpleMode, this.name);
    }

    save(e, shouldInform: boolean) {
        document.querySelector('header .control.autosave').classList.add('working');

        let gs = new GameState();
        gs.isSimpleMode = this.isSimpleMode;
        gs.isBlackTurn = this.isBlackTurn;
        gs.targetSignal = this.targetSignal;
        gs.blackSignal = this.blackSignal;
        gs.whiteSignal = this.whiteSignal;
        gs.prevColorIndex = this.prevColorIndex;
        gs.prevSignal = this.prevSignal;
        gs.name = this.name;
        let spc: Piece = null;
        if (this.blackLocked == null) {
            gs.blackLocked = -1;
        } else {
            spc = this.blackLocked.piece;
            gs.blackLocked = coordsToBoardIndex(spc.positionLetterIndex, spc.positionNumber);
        }
        if (this.whiteLocked == null) {
            gs.whiteLocked = -1;
        } else {
            spc = this.whiteLocked.piece;
            gs.whiteLocked = coordsToBoardIndex(spc.positionLetterIndex, spc.positionNumber);
        }
        gs.boardSquares = [];
        this.boardSquares.forEach((bsq)=> {
            gs.boardSquares.push(new BoardSquare(bsq.piece, null));
        });

        let t = document.querySelector('.turns-taken');
        gs.blackTurnsTaken = parseInt(t.querySelector('.black span').textContent);
        gs.whiteTurnsTaken = parseInt(t.querySelector('.white span').textContent);

        this.lastSaveDate = gs.lastSaveDate = Date.now();

        this.storage.set(this.id, gs).then(()=> {
            this.events.publish('game:saved', true);

            if (shouldInform) {
                let toast = this.toastCtrl.create({
                    message: 'Saved Sex!',
                    duration: 1000,
                    position: 'bottom',
                    cssClass: 'sexapp-game'
                });
                toast.present();
            }

            document.querySelector('header .control.autosave').classList.remove('working');
        });
    }

    share(e) {
        let toast = this.toastCtrl.create({
            message: 'tosotolabs.info/sex',
            position: 'middle',
            showCloseButton: true,
            closeButtonText: 'Ok',
            cssClass: 'sexapp-share'
        });
        toast.present();
    }

    pieceTap(e) {
        let res = null;
        if(this.isBlackTurn) {
            res = pieceTap_(e, this.boardSquares, this.blackSelection, this.blackLocked, this.isSimpleMode, this.isBlackTurn, this.targetSignal, this.prevColorIndex, this.prevSignal, this.blackSignal, this.toastCtrl);
            this.blackSelection = res.selection;
            this.blackLocked = res.locked;
            this.isBlackTurn = res.isBlackTurn;
        } else {
            res = pieceTap_(e, this.boardSquares, this.whiteSelection, this.whiteLocked, this.isSimpleMode, this.isBlackTurn, this.targetSignal, this.prevColorIndex, this.prevSignal, this.whiteSignal, this.toastCtrl);
            this.whiteSelection = res.selection;
            this.whiteLocked = res.locked;
            this.isBlackTurn = res.isBlackTurn;
        }

        if (res.didMove) {
            this.prevColorIndex = this.prevSignal = null;

            let t = null;
            if (this.isBlackTurn) {
                t = document.querySelector('.turns-taken .black');
                t.classList.add('current-turn');
                document.querySelector('.turns-taken .white').classList.remove('current-turn');

                if(this.blackSelection != null && this.blackSelection.piece == null) {
                    // selection is white piece recently moved
                    this.blackSelection.nativeElement.querySelector('.piece').classList.remove('black-selection');
                    this.blackSelection = res.selection;
                    this.blackSelection.nativeElement.querySelector('.piece').classList.add('black-selection');
                }
            } else {
                t = document.querySelector('.turns-taken .white');
                t.classList.add('current-turn');
                document.querySelector('.turns-taken .black').classList.remove('current-turn');

                if(this.whiteSelection != null && this.whiteSelection.piece == null) {
                    // selection is black piece recently moved
                    this.whiteSelection.nativeElement.querySelector('.piece').classList.remove('white-selection');
                    this.whiteSelection = res.selection;
                    this.whiteSelection.nativeElement.querySelector('.piece').classList.add('white-selection');
                }
            }

            let tsp = t.querySelector('span');
            tsp.textContent = ''+(parseInt(tsp.textContent)+1);

            let sel = this.isBlackTurn ? this.blackSelection : this.whiteSelection;

            if (sel != null) {
                let side = this.isBlackTurn ? 'black' : 'white',
                    spc = sel.piece;

                if (this.isSimpleMode) {
                    let pckrs = document.getElementsByClassName(side+' color-picker');
                    Array.prototype.forEach.call(pckrs, pckr=> {
                        pckr.classList.add('color-picker-active');
                        pckr.querySelector('button').removeAttribute(ATTRIBUTE_DISABLED);
                    });
                    pckrs[spc.colorIndex].querySelector('button').classList.add('selected');
                } else {
                    let sigc = document.querySelector('.'+side+'.signals-container'),
                        psig = sigc.querySelector('.piece.signal'),
                        sigframe = psig.querySelector('iframe'),
                        sig = spc.signal,
                        sig_t = sig.map(x=>''+(Math.round(x*100)/100)),
                        opts = {
                            labels: sig_t,
                            data:  sig,
                            dragData: spc.isBlack === this.isBlackTurn
                        }

                    sigframe.contentWindow.postMessage(opts, "*");

                    sigc.classList.add('piece-active');

                    psig.querySelector('.name').textContent = ''+positionLetters[spc.positionLetterIndex]+spc.positionNumber;
                    psig.querySelector('.correlation-score').textContent = ''+(Math.round(calculateCorrelation(sig,this.targetSignal,true,true,false)*1e20)/1e18);
                }

                enableMoves(getPossibleMoves(spc.positionLetterIndex,spc.positionNumber,this.boardSquares));
            }

            if (this.lastSaveDate != null) this.save(null,false);
        }
    }

    piecePress(e) {
        let pelem = e.target.parentNode,
            bsqelem = pelem.parentNode.parentNode,
            l = parseInt(bsqelem.getAttribute(ATTRIBUTE_LETTER_INDEX)),
            pn = parseInt(bsqelem.getAttribute(ATTRIBUTE_POSITION_NUMBER)),
            sel = this.boardSquares[coordsToBoardIndex(l,pn)],
            osel = this.isBlackTurn ? this.whiteSelection : this.blackSelection,
            // side = this.isBlackTurn ? 'black' : 'white',
            flipSide = this.isBlackTurn ? 'white' : 'black';

        // if (sel.piece == null || (this.isSimpleMode && sel.piece.isBlack === this.isBlackTurn)) return;
        if (sel.piece == null) return;

        let spc = sel.piece;

        if (this.isBlackTurn) {
            this.whiteSelection = null;
        } else {
            this.blackSelection = null;
        }

        if (osel != null) {
            let ospc = osel.piece;
            osel.nativeElement.querySelector('.piece').classList.remove(flipSide+'-selection');

            if (ospc != null && ospc.positionLetterIndex === spc.positionLetterIndex && ospc.positionNumber === spc.positionNumber) {
                if (this.isSimpleMode === false) document.querySelector('.'+flipSide+'.signals-container').classList.remove('piece-active');

                return;
            }
        }

        if (this.isBlackTurn) {
            this.whiteSelection = sel;
        } else {
            this.blackSelection = sel;
        }

        if (this.isSimpleMode === false) {
            let sigc = document.querySelector('.'+flipSide+'.signals-container'),
                psig = sigc.querySelector('.piece.signal'),
                sigframe = psig.querySelector('iframe'),
                sig_t = spc.signal.map(x=>''+(Math.round(x*100)/100)),
                opts = {
                    labels: sig_t,
                    data: spc.signal,
                    dragData: false
                }

            let nmprfx = '';
            if (spc.isBlack === this.isBlackTurn) nmprfx= '(Opponent) ';
            psig.querySelector('.name').textContent = nmprfx+positionLetters[spc.positionLetterIndex]+spc.positionNumber;
            psig.querySelector('.correlation-score').textContent = ''+(Math.round(calculateCorrelation(spc.signal,this.targetSignal,true,true,false)*1e20)/1e18);

            sigframe.contentWindow.postMessage(opts, "*");

            sigc.classList.add('piece-active');
        }

        pelem.classList.add(flipSide+'-selection');
    }

    colorPickerTap(e) {
        let locked: BoardSquare,
            side = this.isBlackTurn ? 'black' : 'white',
            oselc = document.querySelector('.'+side+'.color-picker button.selected'),
            oci = pieceSimpleColors.indexOf(oselc.parentElement.parentElement.getAttribute(ATTRIBUTE_PIECE_COLOR)),
            c = e.target.parentNode.parentNode.getAttribute(ATTRIBUTE_PIECE_COLOR),
            ci = pieceSimpleColors.indexOf(c),
            sel = this.isBlackTurn ? this.blackSelection : this.whiteSelection;

        if (oci === ci) return;

        if (getPossibleMoves(sel.piece.positionLetterIndex, sel.piece.positionNumber, this.boardSquares).length === 0) {
            let pos = positionLetters[sel.piece.positionLetterIndex]+sel.piece.positionNumber,
                toast = this.toastCtrl.create({
                    message: pos+' is blocked at all directions!',
                    duration: 7000,
                    position: 'bottom',
                    showCloseButton: true,
                    closeButtonText: 'Ok',
                    cssClass: sel.piece.isBlack ? 'sexapp-game' : 'sexapp-game white'
                });

                toast.present();
            return;
        }

        if (ci === this.prevColorIndex) {
            let pos = positionLetters[sel.piece.positionLetterIndex]+sel.piece.positionNumber,
                toast = this.toastCtrl.create({
                    message: pos+' is disturbed. That was its previous color.',
                    duration: 7000,
                    position: 'bottom',
                    showCloseButton: true,
                    closeButtonText: 'Ok',
                    cssClass: sel.piece.isBlack ? 'sexapp-game' : 'sexapp-game white'
                });

                toast.present();
            return;
        }

        if (this.isBlackTurn) {
            this.blackLocked = locked = sel;
        } else {
            this.whiteLocked = locked = sel;
        }

        if (this.prevColorIndex == null) this.prevColorIndex = oci;

        locked.nativeElement.querySelector('.piece').classList.add('disturbed');

        // remove focus from current color picker
        oselc.classList.remove('selected');

        // select new color picker
        e.target.classList.add('selected');
        locked.piece.colorIndex = ci;
        locked.nativeElement.querySelector('.piece').setAttribute(ATTRIBUTE_PIECE_COLOR, c);
    }
}

const interact = (mover: BoardSquare, sig_: Process[], bsqs: BoardSquare[], targetSignal: number[], isSimpleMode: boolean, toastCtrl: ToastController)=> {
    if (mover.piece == null) return;

    let pos = positionLetters[mover.piece.positionLetterIndex]+mover.piece.positionNumber,
        nbrs = getNeighbors(mover.piece.positionLetterIndex, mover.piece.positionNumber, bsqs, mover.piece.isBlack),
        message = pos+' interacts with ',
        nposs = [];

    nbrs.forEach((nbr)=> {
        let npos = positionLetters[nbr.square.piece.positionLetterIndex]+nbr.square.piece.positionNumber;
        if (isSimpleMode) {
            let bias = mover.piece.colorIndex === nbr.square.piece.colorIndex ? Process.positiveBound(nbr.bias*2) : nbr.bias;
            sig_[nbr.square.piece.colorIndex].update(bias);
            npos += '|'+nbr.bias;
        } else {
            let avgsig = averageSignals(mover.piece.signal, nbr.square.piece.signal);
            for (let i = 0; i < sig_.length; i++) { sig_[i].update(avgsig[i]); }
        }
        nposs.push(npos);
    });
    message+=intercalate_str(", ",nposs);

    let toast = toastCtrl.create({
        message: message,
        duration: 10000,
        showCloseButton: true,
        closeButtonText: 'Ok',
        position: 'bottom',
        cssClass: mover.piece.isBlack ? 'sexapp-game' : 'sexapp-game white'
    });

    toast.present();

    setScoreSignal(mover.piece.isBlack, sig_, targetSignal);
}

// applies to only complex mode
const signalChange_ = (index: number, value: number, selection: BoardSquare, targetSignal: number[], isStart: boolean, isEnd: boolean, isBothSelection: boolean)=> {
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

    let opp_psig = null;
    if (isBothSelection) {
        opp_psig = selection.piece.isBlack ? document.querySelector('.white .piece.signal') : document.querySelector('.black .piece.signal');
    }

    if (isStart) {
        pvwr.classList.add('active');
        psig.querySelector('.info').classList.add('changing');
        if (isBothSelection) opp_psig.querySelector('.info').classList.add('changing');
    }
    pclrasp.setAttribute(ATTRIBUTE_ASPECT_COLOR, sclr);
    pclrasp.querySelector('span').textContent = ''+letter+number;
    pcam.querySelector('span').textContent = ''+(Math.round(value*1e18)/1e18);
    psig.querySelector('.correlation-score').textContent = ''+(Math.round(corr*1e20)/1e18);
    if (isBothSelection) {
        let sig_t = signal.map(x=>''+(Math.round(x*100)/100)),
            opts = {
                labels: sig_t,
                data:  signal,
                dragData: false
            }
        opp_psig.querySelector('.correlation-score').textContent = ''+(Math.round(corr*1e20)/1e18);
        opp_psig.querySelector('iframe').contentWindow.postMessage(opts, '*');
    }
    if (isEnd) {
        pvwr.classList.remove('active');
        psig.querySelector('.info').classList.remove('changing');
        if (isBothSelection) opp_psig.querySelector('.info').classList.remove('changing');
    }
}

const pieceTap_ = (e, bsqs: BoardSquare[], selection: BoardSquare, locked: BoardSquare, isSimpleMode: boolean, isBlackTurn: boolean, targetSignal: number[], prevColorIndex: number, prevSignal: number[], procSig: Process[], toastCtrl: ToastController)=> {
    let pelem = e.target.parentNode,
        bsqelem = pelem.parentNode.parentNode,
        l = parseInt(bsqelem.getAttribute(ATTRIBUTE_LETTER_INDEX)),
        pn = parseInt(bsqelem.getAttribute(ATTRIBUTE_POSITION_NUMBER)),
        bsq = bsqs[coordsToBoardIndex(l,pn)],
        selclass = isBlackTurn ? 'black-selection' : 'white-selection',
        side = isBlackTurn ? 'black' : 'white',
        didMove = false,
        thing = isSimpleMode ? 'color' : 'signal';

    if (bsq.piece == null) { // move current locked
        if (locked == null) {
            let toast = toastCtrl.create({
                message: 'Change the piece\'s '+thing+' before you move it.',
                duration: 7000,
                showCloseButton: true,
                closeButtonText: 'Ok',
                position: 'bottom',
                cssClass: selection.piece.isBlack ? 'sexapp-game' : 'sexapp-game white'
            });

            toast.present();
        } else {
            let spc = locked.piece;
            if ((isSimpleMode && spc.colorIndex === prevColorIndex) || (isSimpleMode === false && arraysEqual(spc.signal, prevSignal))) {
                let pos = positionLetters[spc.positionLetterIndex]+spc.positionNumber,
                    toast = toastCtrl.create({
                        message: 'Change the '+thing+' of '+pos+' before you move it.',
                        duration: 7000,
                        showCloseButton: true,
                        closeButtonText: 'Ok',
                        position: 'bottom',
                        cssClass: locked.piece.isBlack ? 'sexapp-game' : 'sexapp-game white'
                    });

                toast.present();

                return {
                    selection: selection,
                    locked: locked,
                    isBlackTurn: isBlackTurn
                }
            }

            voidMoves(getPossibleMoves(spc.positionLetterIndex, spc.positionNumber, bsqs));

            bsq.piece = spc;
            locked.piece = null;
            let lpelem = locked.nativeElement.querySelector('.piece');
            lpelem.classList.remove('disturbed');
            lpelem.classList.remove('black-selection');
            lpelem.classList.remove('white-selection');

            updateSquarePair(bsq, locked, isSimpleMode);

            interact(bsq, procSig, bsqs, targetSignal, isSimpleMode, toastCtrl);

            if (isSimpleMode) {
                let oselc = document.querySelector('.'+side+'.color-picker button.selected');
                if (oselc != null) oselc.classList.remove('selected');

                let pckrs = document.getElementsByClassName(side+' color-picker');
                Array.prototype.forEach.call(pckrs, pckr=>{
                    pckr.classList.remove('color-picker-active');
                    pckr.querySelector('button').setAttribute(ATTRIBUTE_DISABLED, 'true');
                });
            } else {
                let side = isBlackTurn ? 'black' : 'white',
                    sigc = document.querySelector('.'+side+'.signals-container'),
                    psig = sigc.querySelector('.piece.signal'),
                    sigframe = psig.querySelector('iframe'),
                    opts = {
                        dragData: false
                    }

                psig.querySelector('.name').textContent = ''+positionLetters[spc.positionLetterIndex]+spc.positionNumber;

                sigc.classList.remove('piece-active');
                bsq.nativeElement.querySelector('.piece').classList.remove(side+'-selection'); // NOTE: do this in updateSquarePair?

                sigframe.contentWindow.postMessage(opts, "*");
            }

            selection = bsq;
            pelem.classList.add(selclass);
            locked = null;
            isBlackTurn = !isBlackTurn;
            didMove = true;

            alternatePieceState(bsqs,isBlackTurn);
        }
    } else {
        // if (isSimpleMode && bsq.piece.isBlack !== isBlackTurn)
        //     return {
        //         selection: selection,
        //         locked: locked,
        //         isBlackTurn: isBlackTurn,
        //     }
        if (selection != null) {
            let spc = selection.piece;

            if (spc.isBlack === isBlackTurn) { // due side tapped own piece again
                removeFocus(selection, selclass, bsqs);
            } else { // due side tapped opponent piece again
                selection.nativeElement.querySelector('.piece').classList.remove(selclass);
            }

            if (isSimpleMode) {
                let pckrs = document.getElementsByClassName(side+' color-picker');
                Array.prototype.forEach.call(pckrs, pckr=>{
                    pckr.classList.remove('color-picker-active');
                    pckr.querySelector('button').setAttribute(ATTRIBUTE_DISABLED, 'true');
                });
                let oselc = document.querySelector('.'+side+'.color-picker button.selected');
                if (oselc != null) oselc.classList.remove('selected');
            } else {
                let side = isBlackTurn ? 'black' : 'white',
                    sigc = document.querySelector('.'+side+'.signals-container'),
                    psig = sigc.querySelector('.piece.signal'),
                    sigframe = psig.querySelector('iframe'),
                    opts = {
                        dragData: false
                    }

                sigframe.contentWindow.postMessage(opts, "*");

                sigc.classList.remove('piece-active');
            }

            // current selection is the same as what was tapped; remove focus
            if (spc.positionLetterIndex === l && spc.positionNumber === pn)
                return {
                    selection: null,
                    locked: locked,
                    isBlackTurn: isBlackTurn
                }
        }

        selection = bsq;
        pelem.classList.add(selclass);
        let spc = selection.piece,
            pmvs = getPossibleMoves(l,pn,bsqs);

        if (bsq.piece.isBlack == isBlackTurn && (locked == null || (locked.piece.positionLetterIndex === l && locked.piece.positionNumber === pn)))
            enableMoves(pmvs);

        if (pmvs.length === 0) {
            let pos = positionLetters[l]+pn,
                toast = toastCtrl.create({
                    message: pos+' is blocked at all directions!',
                    duration: 7000,
                    showCloseButton: true,
                    closeButtonText: 'Ok',
                });

            if (isBlackTurn && spc.isBlack) {
                toast.setPosition('bottom');
                toast.setCssClass('sexapp-game');
                toast.present();
            } else if (isBlackTurn === false && spc.isBlack === false) {
                toast.setPosition('top');
                toast.setCssClass('sexapp-game white');
                toast.present();
            }
        }

        if (isSimpleMode) {
            if (spc.isBlack === isBlackTurn && (locked == null || (locked.piece.positionLetterIndex === l && locked.piece.positionNumber === pn))) {
                let pckrs = document.getElementsByClassName(side+' color-picker');
                Array.prototype.forEach.call(pckrs, pckr=> {
                    pckr.classList.add('color-picker-active');
                    pckr.querySelector('button').removeAttribute(ATTRIBUTE_DISABLED);
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
                sig_t = sig.map(x=>''+(Math.round(x*100)/100)),
                opts = {
                    labels: sig_t,
                    data:  sig,
                    dragData: spc.isBlack === isBlackTurn && (locked == null || (locked.piece.positionLetterIndex === l && locked.piece.positionNumber === pn)) && pmvs.length > 0
                }

            sigframe.contentWindow.postMessage(opts, "*");

            sigc.classList.add('piece-active');

            let nmprfx = '';
            if (spc.isBlack !== isBlackTurn) nmprfx= '(Opponent) ';
            psig.querySelector('.name').textContent = nmprfx+positionLetters[spc.positionLetterIndex]+spc.positionNumber;
            psig.querySelector('.correlation-score').textContent = ''+(Math.round(calculateCorrelation(sig,targetSignal,true,true,false)*1e20)/1e18);
        }
    }

    return {
        selection: selection,
        locked: locked,
        isBlackTurn: isBlackTurn,
        didMove: didMove
    }
}

const enableMoves = (bsqs: BoardSquare[])=> {
    bsqs.forEach((bsq)=> {
        let ta = bsq.nativeElement.querySelector('.touch-area');
        ta.removeAttribute(ATTRIBUTE_DISABLED);
        ta.classList.add('possible-move');
    });
}

const voidMoves = (bsqs: BoardSquare[])=> {
    bsqs.forEach((bsq)=> {
        let ta = bsq.nativeElement.querySelector('.touch-area');
        ta.setAttribute(ATTRIBUTE_DISABLED, 'true');
        ta.classList.remove('possible-move');
    });
}

// Be sure to remove focus before moving a piece finally
const removeFocus = (bsq: BoardSquare, selclass: string, bsqs: BoardSquare[])=> {
    let pelem = bsq.nativeElement.querySelector('.piece'),
        pc = bsq.piece;
    pelem.classList.remove(selclass);
    voidMoves(getPossibleMoves(pc.positionLetterIndex, pc.positionNumber, bsqs));
}

const setupBoard = (boardSquares: BoardSquare[], isSimpleMode: boolean, isBlackTurn: boolean, targetSignal: number[], fromBoardSquares: BoardSquare[])=> {

    if (fromBoardSquares == null) {
        for (let i = 0; i < 6; i++) {
            boardSquares[i].piece = new Piece(false, i%6, null, null);
            boardSquares[i+12].piece = new Piece(false, 5-i%6, null, null);
            boardSquares[i+18].piece = new Piece(true, i%6, null, null);
            boardSquares[i+30].piece = new Piece(true, 5-i%6, null, null);
        }
    }

    if (isBlackTurn) {
        document.querySelector('.turns-taken .black').classList.add('current-turn');
    } else {
        document.querySelector('.turns-taken .white').classList.add('current-turn');
    }

    Array.prototype.forEach.call(document.getElementsByClassName('target signal'), (tsig)=> {
        let sigframe = tsig.querySelector('iframe'),
            sig_t = targetSignal.map(x=>''+(Math.round(x*100)/100)),
            opts = {
                labels: sig_t,
                data:  targetSignal,
                dragData: false
            }

        sigframe.contentWindow.postMessage(opts, "*");
    });

    for (let i = 0; i < boardSquares.length; i++) {
        let bsq = boardSquares[i],
            p: Piece = null,
            pelem = bsq.nativeElement.querySelector('.piece'),
            pelemb = bsq.nativeElement.querySelector('.touch-area');
        if (fromBoardSquares == null) {
            p = bsq.piece;
        } else if(fromBoardSquares[i].piece != null) {
            let fbp = fromBoardSquares[i].piece;
            p = bsq.piece = new Piece(fbp.isBlack, fbp.colorIndex, fbp.positionLetterIndex, fbp.positionNumber);
            p.signal = fbp.signal;
        }
        pelem.classList.remove('disturbed');
        pelem.classList.remove('black-selection');
        pelem.classList.remove('white-selection');
        if (p != null) {
            let side = p.isBlack ? PROPERTY_BLACK : PROPERTY_WHITE,
                color = isSimpleMode ? pieceSimpleColors[p.colorIndex] : side;
            pelem.setAttribute(ATTRIBUTE_PIECE_SIDE, side);
            pelem.setAttribute(ATTRIBUTE_PIECE_COLOR, color);
            pelemb.removeAttribute(ATTRIBUTE_DISABLED);
            p.positionLetterIndex = parseInt(bsq.nativeElement.getAttribute(ATTRIBUTE_LETTER_INDEX));
            p.positionNumber = parseInt(bsq.nativeElement.getAttribute(ATTRIBUTE_POSITION_NUMBER));

            if (p.isBlack === isBlackTurn) {
                pelem.classList.add('woke');
            } else {
                pelem.classList.remove('woke');
            }
        } else {
            pelem.removeAttribute(ATTRIBUTE_PIECE_SIDE);
            pelem.removeAttribute(ATTRIBUTE_PIECE_COLOR);
            pelemb.setAttribute(ATTRIBUTE_DISABLED, 'true');
        }
    };
}

const alternatePieceState = (bsqs: BoardSquare[], isBlackTurn: boolean)=> {
    bsqs.forEach((bsq)=> {
        if (bsq.piece != null && bsq.piece.isBlack === isBlackTurn) {
            bsq.nativeElement.querySelector('.piece').classList.add('woke');
            return;
        }

        bsq.nativeElement.querySelector('.piece').classList.remove('woke');
    });
}

const updateSquarePair = (nbsq: BoardSquare, obsq: BoardSquare, isSimpleMode: boolean)=> {
    let p = nbsq.piece,
        npc = nbsq.nativeElement.querySelector('.piece'),
        npcb = nbsq.nativeElement.querySelector('.touch-area'),
        opc = obsq.nativeElement.querySelector('.piece'),
        opcb = obsq.nativeElement.querySelector('.touch-area');

    let side = p.isBlack ? PROPERTY_BLACK : PROPERTY_WHITE,
        color = isSimpleMode ? pieceSimpleColors[p.colorIndex] : side;
    npc.setAttribute(ATTRIBUTE_PIECE_SIDE, side);
    npc.setAttribute(ATTRIBUTE_PIECE_COLOR, color);
    npcb.removeAttribute(ATTRIBUTE_DISABLED);
    p.positionLetterIndex = parseInt(nbsq.nativeElement.getAttribute(ATTRIBUTE_LETTER_INDEX));
    p.positionNumber = parseInt(nbsq.nativeElement.getAttribute(ATTRIBUTE_POSITION_NUMBER));

    opc.removeAttribute(ATTRIBUTE_PIECE_SIDE);
    opc.removeAttribute(ATTRIBUTE_PIECE_COLOR);
    opcb.setAttribute(ATTRIBUTE_DISABLED, 'true');
}

const getPossibleMoves = (positionLetterIndex: number, positionNumber: number, bsqs: BoardSquare[])=> {
    let psbsqs = [],
        prevl = positionLetterIndex-1,
        nextl = positionLetterIndex+1,
        prevn = positionNumber-1,
        nextn = positionNumber+1,
        bsq: BoardSquare = null;

    if (prevl >= 0) {
        bsq = bsqs[coordsToBoardIndex(prevl,positionNumber)]; // left
        if (bsq.piece == null) psbsqs.push(bsq);
        if (prevn >= 0) {
            bsq = bsqs[coordsToBoardIndex(prevl,prevn)]; // bottom-left
            if (bsq.piece == null) psbsqs.push(bsq);
        }
        if (nextn < 6) {
            bsq = bsqs[coordsToBoardIndex(prevl,nextn)]; // top-left
            if (bsq.piece == null) psbsqs.push(bsq);
        }
    }
    if (nextl < 6) {
        bsq = bsqs[coordsToBoardIndex(nextl,positionNumber)]; // right
        if (bsq.piece == null) psbsqs.push(bsq);
        if (prevn >= 0) {
            bsq = bsqs[coordsToBoardIndex(nextl,prevn)]; // bottom-right
            if (bsq.piece == null) psbsqs.push(bsq);
        }
        if (nextn < 6) {
            bsq = bsqs[coordsToBoardIndex(nextl,nextn)]; // top-right
            if (bsq.piece == null) psbsqs.push(bsq);
        }
    }
    if (prevn >= 0) {
        bsq = bsqs[coordsToBoardIndex(positionLetterIndex,prevn)]; // down
        if (bsq.piece == null) psbsqs.push(bsq);
    }
    if (nextn < 6) {
        bsq = bsqs[coordsToBoardIndex(positionLetterIndex,nextn)]; // up
        if (bsq.piece == null) psbsqs.push(bsq);
    }

    return psbsqs;
}

const biasForDirection = (direction: string, isReversed: boolean)=> {
    switch (direction) {
        case 'up': return isReversed ? 0.5 : 1;
        case 'top-right': return isReversed ? 0.375 : 0.875;
        case 'right': return isReversed ? 0.25 : 0.75;
        case 'bottom-right': return isReversed ? 0.125 : 0.625;
        case 'down': return isReversed ? 1 : 0.5;
        case 'bottom-left': return isReversed ? 0.875 : 0.375;
        case 'left': return isReversed ? 0.75 : 0.25;
        case 'top-left': return isReversed ? 0.625 : 0.125;
        default: return 0;
    }
}

const getNeighbors = (positionLetterIndex: number, positionNumber: number, bsqs: BoardSquare[], isForBlack)=> {
    let psbsqs = [],
        prevl = positionLetterIndex-1,
        nextl = positionLetterIndex+1,
        prevn = positionNumber-1,
        nextn = positionNumber+1,
        bsq: BoardSquare = null;

    if (prevl >= 0) {
        bsq = bsqs[coordsToBoardIndex(prevl,positionNumber)]; // left
        if (bsq.piece != null) psbsqs.push({square: bsq, bias:biasForDirection('left', !isForBlack)});
        if (prevn >= 0) {
            bsq = bsqs[coordsToBoardIndex(prevl,prevn)]; // bottom-left
            if (bsq.piece != null) psbsqs.push({square: bsq, bias:biasForDirection('bottom-left', !isForBlack)});
        }
        if (nextn < 6) {
            bsq = bsqs[coordsToBoardIndex(prevl,nextn)]; // top-left
            if (bsq.piece != null) psbsqs.push({square: bsq, bias:biasForDirection('top-left', !isForBlack)});
        }
    }
    if (nextl < 6) {
        bsq = bsqs[coordsToBoardIndex(nextl,positionNumber)]; // right
        if (bsq.piece != null) psbsqs.push({square: bsq, bias:biasForDirection('right', !isForBlack)});
        if (prevn >= 0) {
            bsq = bsqs[coordsToBoardIndex(nextl,prevn)]; // bottom-right
            if (bsq.piece != null) psbsqs.push({square: bsq, bias:biasForDirection('bottom-right', !isForBlack)});
        }
        if (nextn < 6) {
            bsq = bsqs[coordsToBoardIndex(nextl,nextn)]; // top-right
            if (bsq.piece != null) psbsqs.push({square: bsq, bias:biasForDirection('top-right', !isForBlack)});
        }
    }
    if (prevn >= 0) {
        bsq = bsqs[coordsToBoardIndex(positionLetterIndex,prevn)]; // down
        if (bsq.piece != null) psbsqs.push({square: bsq, bias:biasForDirection('down', !isForBlack)});
    }
    if (nextn < 6) {
        bsq = bsqs[coordsToBoardIndex(positionLetterIndex,nextn)]; // up
        if (bsq.piece != null) psbsqs.push({square: bsq, bias:biasForDirection('up', !isForBlack)});
    }

    return psbsqs;
}

const gatherBoardSquares = ()=> {
    let bsqs = [];
    let bsqs_ = document.getElementsByClassName('square playable');
    for (let i = 0; i < bsqs_.length; i++) {
        bsqs.push(new BoardSquare(null,bsqs_[i]));
    }

    return bsqs;
}

const coordsToBoardIndex = (positionLetterIndex: number, positionNumber: number)=> {
    return 5*(5-positionNumber)+(5-positionNumber)+positionLetterIndex;
}

const setScoreSignal = (isForBlack: boolean, sig_: Process[], targetSignal: number[])=> {
    let side = isForBlack ? 'black' : 'white',
        scsig = document.querySelector('.'+side+' .score.signal'),
        sccorr = scsig.querySelector('.correlation-score'),
        scframe = scsig.querySelector('iframe'),
        sig = stripSignal(sig_),
        sig_t = sig.map(x=>''+Math.round(x*100)/100),
        opts = {
            labels: sig_t,
            data: sig
        }

    sccorr.textContent = ''+(Math.round(calculateCorrelation(sig,targetSignal,true,true,false)*1e20)/1e18);
    scframe.contentWindow.postMessage(opts, '*');
}

const resetColorPickers = (isForBlack: boolean)=> {
    let side = isForBlack ? 'black' : 'white',
        pckrs = document.getElementsByClassName(side+' color-picker')
    Array.prototype.forEach.call(pckrs, pckr=>{
        pckr.classList.remove('color-picker-active');
        pckr.querySelector('button').setAttribute(ATTRIBUTE_DISABLED, 'true');
    });
    let oselc = document.querySelector('.'+side+'.color-picker button.selected');
    if (oselc != null) oselc.classList.remove('selected');
}

const resetPieceSignals = (isForBlack: boolean)=> {
    let side = isForBlack ? 'black' : 'white',
        sigc = document.querySelector('.'+side+'.signals-container'),
        psig = sigc.querySelector('.piece.signal'),
        sigframe = psig.querySelector('iframe'),
        opts = {
            dragData: false
        }

    sigframe.contentWindow.postMessage(opts, "*");

    sigc.classList.remove('piece-active');
}

const calculateCorrelation = (sig: number[], tsig: number[], diversityIsRelative: boolean, useDistance: boolean, shouldNormalize: boolean)=> {
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

const perms = (signal: number[])=> {
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

const averageSignals = (siga: number[], sigb: number[])=> {
    let sigc = [];
    for (let i = 0; i < siga.length; i++) {
        let a = siga[i],
            b = sigb[i];
        if (b == null) b = 0;
        sigc.push((a+b)/2);
    }
    return sigc;
}

const stripSignal = (procsig: Process[]) => { return procsig.map(proc=>proc.value); }

const normalize = (arr: number[])=> {
    let max = Math.max(...arr);
    if (max === 0) return arr;
    return arr.map(x=>x/max);
}

const arraysEqual = (a, b)=> {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

const generateUUID = ()=> {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

const intercalate_str = (str: string, strs: string[])=> {
    let res = '';
    for (let i = 0; i < strs.length; i++) {
        res+=strs[i];
        if (i < strs.length-1) res+=str;
    }
    return res;
}

const formatDate = (date: Date)=> {
    const opts = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'};
    return date.toLocaleDateString(undefined, opts);
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
        for (let i = 0; i < 6; i++) { signal.push(1e-6); }
        this.signal = signal;
    }
}

const pieceSimpleColors = ["red","green","orange","blue","yellow","purple"],
    // pieceColors = ['Red','MediumSpringGreen','Orange','DodgerBlue','Yellow','Fuchsia'],
    positionLetters = ['A','B','C','D','E','F'];

class BoardSquare {
    piece: Piece;
    nativeElement: Element;

    constructor(piece: Piece, nativeElement: Element) {
        this.piece = piece;
        this.nativeElement = nativeElement;
    }
}

class Process {
    times: number = 1;
    total: number = 1;

    constructor(public value: number) {
    }

    update(entry: number) {
        let ov = this.value,
            ototal = this.total,
            otimes = this.times,
            times = otimes+1,
            total = ototal + entry,
            nfq = total/times,
            ofq = ototal/otimes,
            denom = Math.max(nfq,ofq),
            nov = (nfq-ofq)/denom;

        if (nov === -Infinity || nov === Infinity)
            nov = 0;

        nov = Process.fullBound(nov);

        let v = Process.positiveBound(ov*(1+nov));

        this.value = v;
        this.times = times;
        this.total = total;
    }

    static fullBound(value: number) {
        if (value < -1) return -1;
        if (value > 1) return 1;
        return value;
    }

    static positiveBound(value: number) {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }
}

// class Settings {
//     isSimpleMode: boolean = true;
//     blackVision: string = VISION_BALANCED;
//     whiteVision: string = VISION_BALANCED;
//
//     constructor() {
//
//     }
// }

class GameState {
    boardSquares: BoardSquare[];
    isSimpleMode: boolean;
    isBlackTurn: boolean;
    blackSelection: number;
    whiteSelection: number;
    blackLocked: number;
    whiteLocked: number;
    blackSignal: Process[];
    whiteSignal: Process[];
    blackTurnsTaken: number;
    whiteTurnsTaken: number;
    targetSignal: number[];
    prevColorIndex: number;
    prevSignal: number[];
    lastSaveDate: number;
    name: string;

    constructor() {

    }
}

const
    ATTRIBUTE_LETTER_INDEX = 'letterIndex',
    ATTRIBUTE_POSITION_NUMBER = 'number',
    ATTRIBUTE_PIECE_SIDE = 'pieceSide',
    ATTRIBUTE_PIECE_COLOR = 'pieceColor',
    ATTRIBUTE_ASPECT_COLOR = 'aspectColor',
    ATTRIBUTE_DISABLED = 'disabled';
    // ATTRIBUTE_ADJUSTABLE = 'adjustable';
const
    PROPERTY_BLACK = 'black',
    PROPERTY_WHITE = 'white';

// const
//     VISION_INTUITION = "VISION_INTUITION",
//     VISION_LOGIC = "VISION_LOGIC",
//     VISION_BALANCED = "VISION_BALANCED";
