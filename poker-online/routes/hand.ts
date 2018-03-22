﻿import Card = require('./card');
class Hand {
    //Hand of Poker
    c1: Card;
    c2: Card;
    c3: Card;
    c4: Card;
    c5: Card;
    private rank: any;
    constructor(c1:Card, c2:Card, c3:Card, c4:Card, c5:Card) {
        this.c1 = c1;
        this.c2 = c2;
        this.c3 = c3;
        this.c4 = c4;
        this.c5 = c5;
        this.rank = this.judge();
    }
    getRank(): any {
        return this.rank;
    }
    getCards(): Array<Card> {
        return [this.c1, this.c2, this.c3, this.c4, this.c5];
    }
    private judge(): any {
        //役を判定する
        let suits = this.countSuit();
        let nums = this.countNum();
        let straightCount=0, strength;
        for (var i = 0; i < 13; i++) {
            if (nums[i] == 4) {
                return {
                    strength: i,
                    rank: 7,
                    name: 'four of a kind'
                };
            }
            else if (nums[i] == 3) {
                for (var j = i+1; j < 13; j++) {
                    if (nums[j] == 2) {
                        return {
                            strength: i,
                            rank: 6,
                            name: 'full house'
                        };
                    }
                }
                return {
                    strength: i,
                    rank: 3,
                    name : 'three of a kind'
                }
            }
            else if (nums[i] == 2) {
                for (var j = i+1; j < 13; j++) {
                    if (nums[j] == 3) {
                        return {
                            strength: j,
                            rank: 6,
                            name: 'full house'
                        };
                    }
                    else if (nums[j] == 2) {
                        return {
                            strength: j,
                            rank: 2,
                            name: 'two pair'
                        };
                    }
                    
                }
                return {
                    strength: i,
                    rank: 1,
                    name: 'pair'
                };
            }
            else if (nums[i] == 1) {
                straightCount++;
                strength = i;
                if (straightCount == 5) {
                    if (Math.max.apply(null, suits) == 5) {
                        return {
                            strength: i,
                            rank: 8,
                            name: 'straight flush'
                        };
                    }
                    else {
                        return {
                            strength: i,
                            rank: 4,
                            name: 'straight'
                        };
                    }
                }
            }
            else {
                straightCount = 0;
            }
        }
        if (Math.max.apply(null, suits) == 5) {
            return {
                strength: strength,
                rank: 5,
                name: 'flush'
            };
        }
        else {
            return {
                strength: strength,
                rank: 0,
                name: 'no hand'
            };
        }
    }
    private countNum(): Array<number>{
        let res = new Array<number>(13);
        for (let i = 0; i < 13; i++) {
            res[i] = 0;
        }
        res[this.c1.getNum() - 1]++;
        res[this.c2.getNum() - 1]++;
        res[this.c3.getNum() - 1]++;
        res[this.c4.getNum() - 1]++;
        res[this.c5.getNum() - 1]++;
        return res;
    }
    private countSuit(): Array<number> {
        let res = new Array<number>(4);
        for (let i = 0; i < 4; i++) {
            res[i] = 0;
        }
        res[this.c1.getSuit() - 1]++;
        res[this.c2.getSuit() - 1]++;
        res[this.c3.getSuit() - 1]++;
        res[this.c4.getSuit() - 1]++;
        res[this.c5.getSuit() - 1]++;
        return res;
    }
}
export = Hand;