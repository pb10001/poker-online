"use strict";
class Card {
    constructor(suit, num) {
        //1: spade 2:heart 3:club 4:diamond
        this.suit = suit;
        this.num = num;
        if (num == 1)
            this.strength = 14;
        else
            this.strength = num;
        this.screenName = this.show();
        this.isOpen = false;
    }
    getSuit() {
        return this.suit;
    }
    getNum() {
        return this.num;
    }
    show() {
        let res = "";
        switch (this.suit) {
            case 1:
                res += "♠";
                break;
            case 2:
                res += "♥";
                break;
            case 3:
                res += "♣";
                break;
            case 4:
                res += "♦";
                break;
            default:
                res += "-";
                break;
        }
        switch (this.num) {
            case 1:
                res += "A";
                break;
            case 11:
                res += "J";
                break;
            case 12:
                res += "Q";
                break;
            case 13:
                res += "K";
                break;
            default:
                res += this.num;
                break;
        }
        return res;
    }
}
module.exports = Card;
//# sourceMappingURL=card.js.map