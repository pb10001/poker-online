﻿import async = require("async");

import Card = require("./card");
import Deck = require("./deck");
import Player = require("./player");
import Hand = require("./hand");
import Roster = require("./roster");
import ChatMessage = require("./chatMessage");

class Game{
    private roomName: string;
    private deck: Deck;
    private playerLimit: number;
    roster: Roster;
    private community: Array<Card>;
    ended: Boolean;
    started: Boolean;
    messages: Array<ChatMessage>;
    constructor(name: string, limit: number) {
        this.playerLimit = limit;
        this.deck = new Deck();
        this.roster = new Roster();
        this.community = [];
        this.ended = false;
        this.started = false;
        this.roomName = name;
        this.messages = [];
    }
    initialize(): void {
        this.deck.shuffle();
    }
    private reset(player: Player): void {
        this.community = [];
        this.ended = false;
        this.started = false;
        this.messages = [];
        for (let key in this.roster.players) {
            this.roster.players[key].setHole([]);
            this.notifyCurrent(this.roster.players[key]);
        }
    }
    enter(player: Player): void {
        let exist = false;
        //IPアドレスが同じsocketがあれば、playerを引き継ぐ
        for (let i = 0; i < this.roster.players.length; i++) {
            console.log("current", this.roster.players[i].address);
            console.log("newaddr", player.getSocket().handshake.address);
            if (this.roster.players[i].address === player.getSocket().handshake.address) {
                this.roster.players[i].succeed(player);
                this.notifyCurrent(this.roster.players[i]);
                exist = true;
            }
        }
        if (!exist && this.roster.players.length < this.playerLimit) {
            //Playerを新たに追加する
            player.name =  "Guest" + this.roster.players.length.toString();
            this.roster.add(player);
            let num = this.roster.players.length;
            let socket = player.getSocket();
            player.sendMsg("name", player.name);
            player.sendMsg("player", num);
            player.broadcast("player", num);
            player.broadcast("join", player.getSocket().name + " joined!");

            //人数が揃ったらカードを配る
            if (!this.started&&this.roster.players.length == this.playerLimit) {
                this.distribute();
                this.started = true;
            }
        }
    }
    quit(player: Player): void {
        player.broadcast("player", this.roster.players.length-1);
        player.broadcast("reset", null);
        this.reset(player);
        this.roster.remove(player);
    }
    distribute(): void {
        //人数が揃っていない場合をはじく
        if (this.roster.players.length < 2) return;
        //カードを配る
        this.community = this.deck.draw(5);
        for (var i = 0; i < 3; i++) {
            this.community[i].isOpen = true;
        }
        for (let player in this.roster.players) {
            this.notifyOpen();
            this.roster.players[player].setHole(this.deck.draw(2));
        }
    }
    openNext(): void {
        //Communityをめくる
        if(!this.started) return;
        if (!this.community[3]) return;
        if (!this.community[3].isOpen) {
            this.community[3].isOpen = true;
            this.notifyOpen();
        }
        else if(!this.community[4].isOpen) {
            this.community[4].isOpen = true;
            this.notifyOpen();
            this.ended = true;
        }
        else {
            
        }
    }
    notifyCurrent(player: Player): void {
        //状態を通知する
        player.sendMsg("name", player.name);
        let num = this.roster.players.length;
        player.sendMsg("player", num);
        let hole = player.getHole();
        //if (hole.length != 0) {
        //    player.sendMsg("hole", hole);
        //}
        //if (this.community.length != 0) {
        //    player.sendMsg("community", this.community.filter(x => x.isOpen));
        //}
        player.sendMsg("hole", hole);
        player.sendMsg("community", this.community.filter(x => x.isOpen));
        if (this.community.filter(x=>x.isOpen).length == 5) {
            player.sendMsg("hand", player.getBestHand().getRank());
        }
    }
    private notifyOpen(): void {
        //Notify that a community card has been revealed.
        for (let player in this.roster.players) {
            this.roster.players[player].sendMsg("community", this.community.filter(x=>x.isOpen));
        }
    }
    judgeHand(): void{
        //始まっていない場合をはじく
        if (!this.started) return;
        //HoleとCommunityをあわせた最強の役を見つける
        for (let player in this.roster.players) {
            let hole = this.roster.players[player].getHole();
            let hands = [
                //Communityの組み合わせ10通り
                new Hand(hole[0], hole[1], this.community[0], this.community[1], this.community[2]),
                new Hand(hole[0], hole[1], this.community[0], this.community[1], this.community[3]),
                new Hand(hole[0], hole[1], this.community[0], this.community[1], this.community[4]),
                new Hand(hole[0], hole[1], this.community[0], this.community[2], this.community[3]),
                new Hand(hole[0], hole[1], this.community[0], this.community[2], this.community[4]),
                new Hand(hole[0], hole[1], this.community[0], this.community[3], this.community[4]),
                new Hand(hole[0], hole[1], this.community[1], this.community[2], this.community[3]),
                new Hand(hole[0], hole[1], this.community[1], this.community[2], this.community[4]),
                new Hand(hole[0], hole[1], this.community[1], this.community[3], this.community[4]),
                new Hand(hole[0], hole[1], this.community[2], this.community[3], this.community[4])
            ];
            let bestHand = hands[0]
                , bestRank = hands[0].getRank().rank;
            for (var i = 1; i < 10; i++) {
                let rank = hands[i].getRank().rank;
                if (rank > bestRank) {
                    bestHand = hands[i];
                    bestRank = rank;
                }
            }
            this.roster.players[player].setBestHand(bestHand);
        }
    }
    judgeWinner(): void {
        //始まっていない場合をはじく
        if (!this.started) return;
        async.map(
            this.roster.players,
            (player: Player, callback: Function) => {
                callback(null, player.getBestHand())
            },
            (err: Error, hands: Array<Hand>) => {
                let isDraw: Boolean = true;
                let bestIndex:number = 0;
                let best = hands[0].getRank();
                for (var i = 1; i < hands.length; i++) {
                    if (hands[i].getRank().rank > best.rank) {
                        bestIndex = i;
                        best = hands[i].getRank();
                        isDraw = false;
                    }
                    else if (hands[i].getRank().rank == best.rank) {
                        if (hands[i].getRank().strength > best.strength) {
                            bestIndex = i;
                            best = hands[i].getRank();
                            isDraw = false;
                        }
                        else if (hands[i].getRank().strength < best.strength) {
                            isDraw = false;
                        }
                    }
                    else {
                        isDraw = false;
                    }
                }
                
                let data;
                if (isDraw) {
                    data = {
                        room: this.roomName,
                        content: "Draw!"
                    };
                }
                else {
                    data = {
                        room: this.roomName,
                        content: this.roster.players[bestIndex].name + " wins!"
                    };
                }
                for (let key in this.roster.players) {
                    let p: Player = this.roster.players[key];
                    p.sendMsg("winner", data.content);
                    p.sendMsg("result", this.roster.players.map(x=>x.name + ": " + x.getBestHand().show()));
                }
            });
    }
}

export = Game;