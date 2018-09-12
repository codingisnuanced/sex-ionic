import { Component, ViewChild } from '@angular/core';
import { AlertController, Events, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Storage } from "@ionic/storage";

import { SexGame } from '../pages/home/home';
@Component({
    selector: 'sex-app',
    templateUrl: 'app.html'
})
export class SexApp {
    rootPage:any = SexGame;
    playingWithInput: string;
    selectOptions: {
      title: string;
    } = {
      title: 'Load Sex'
    };
    savedGames: {
      id: string;
      name: string;
      lastSaveDate: number;
      selected: boolean;
    }[];

    constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private events:Events, private alertCtrl: AlertController, private storage: Storage) {
        platform.ready().then(() => {
          // Okay, so the platform is ready and our plugins are available.
          // Here you can do any higher level native things you might need.
          statusBar.hide();
          splashScreen.hide();
        });

        this.events.subscribe('game:new', (isSimpleMode: boolean)=> {
            // let input: HTMLInputElement = document.querySelector('.playing-with input');
            // input.value = '';
            this.playingWithInput = '';
            let desc = document.querySelector('.branding .description');
            desc.querySelector('.mode').textContent = isSimpleMode ? 'Simple' : 'Complex';
            desc.querySelector('.with').textContent = '';
        });

        this.events.subscribe('game:saved', (shouldSelectFirst)=> {
            let len = 0;
            this.savedGames = [];
            this.storage.forEach((gs,id,i)=> {
                len = i.valueOf();
                this.savedGames.push({
                    name: gs.name+' - '+formatDate(new Date(gs.lastSaveDate)),
                    id: id,
                    lastSaveDate: gs.lastSaveDate,
                    selected: false
                });
            }).then(()=> {
                  this.savedGames = this.savedGames.sort((ga,gb)=> { return gb.lastSaveDate - ga.lastSaveDate });
                  if (len > 0 && shouldSelectFirst) this.savedGames[0].selected = true;
                  this.selectOptions.title = 'Load Sex ('+len+')';
            });
        });

        this.events.subscribe('game:loaded', (isSimpleMode, name)=> {
            let desc = document.querySelector('.branding .description');
            desc.querySelector('.mode').textContent = isSimpleMode ? 'Simple' : 'Complex';
            desc.querySelector('.with').textContent = name;
            this.playingWithInput = name;
        });

        this.events.publish('game:saved', false);
    }

    gameNameChange(e) {
        this.playingWithInput = this.playingWithInput.trim();
        let w = document.querySelector('.branding .description .with');
        if (this.playingWithInput === '') {
            w.textContent = '';
        } else {
            w.textContent = 'With '+this.playingWithInput;
        }
        this.events.publish('game:nameChange', this.playingWithInput);
    }

    saveSexTap(e) {
        this.events.publish('game:save', this.playingWithInput);
    }

    loadSexTap(e) {
        let alert = this.alertCtrl.create({
            title: 'Load Sex ('+this.savedGames.length+')',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: data => {
                    }
                },
                // {
                //     text: 'Delete',
                //     cssClass: 'alert-delete',
                //     handler: (data: string[]) => {
                //         if (data == null) return false;
                //         data.forEach(i_ => {
                //             let i = parseInt(i_);
                //
                //         })
                //         return false;
                //     }
                // },
                {
                    text: 'Load',
                    handler: (data) => {
                        if (data == null) return false;
                        let gs_ = this.savedGames[parseInt(data)];
                        this.storage.get(gs_.id).then((gs)=> {
                            this.events.publish('game:load', gs, gs_.id);
                        });
                        return true;
                    }
                }
            ]
        });

        let i = 0;
        this.savedGames.forEach((gs)=> {
            alert.addInput({
              type: 'radio',
              label: gs.name,
              value: i.toString(),
              checked: gs.selected
            });
            i++;
      });

      alert.present();
    }

    startSimpleSex(e) {
        this.events.publish('game:new', true);
    }

    startComplexSex(e) {
        this.events.publish('game:new', false);
    }
}

const formatDate = (date: Date)=> {
    const opts = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'};
    return date.toLocaleDateString(undefined, opts);
}
