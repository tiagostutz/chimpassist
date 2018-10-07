import { RhelenaPresentationModel, globalState } from 'rhelena';
export default class ChatModel extends RhelenaPresentationModel {
    constructor() {
        super();

        globalState.loggedUser = { id: 1, name: "Rachel"}
        this.loggedUser = globalState.loggedUser
        this.chatMessages = [{
            user: {
                id: 1,
                name: "John Smith",
                avatarURL: "https://pickaface.net/gallery/avatar/20130919_112248_1385_mock.png"
            },
            dateTime: "21:01",
            text: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."
        },
        {
            user: {
                id: 1,
                name: "John Smith",
                avatarURL: "https://pickaface.net/gallery/avatar/20130919_112248_1385_mock.png"
            },
            dateTime: "21:11",
            text: "consectetur, adipisci velit"
        },
        {
            user: {
                id: 1,
                name: "John Smith",
                avatarURL: "https://pickaface.net/gallery/avatar/20130919_112248_1385_mock.png"
            },
            dateTime: "21:11",
            text: "Morbi convallis nibh vel sem posuere facilisis. Duis id elit condimentum"
        },
        {
            user: {
                id: 2,
                name: "Robert Smith",
                avatarURL: "https://pickaface.net/gallery/avatar/20130919_112248_1385_mock.png"
            },
            dateTime: "12:22",
            text: "Morbi convallis nibh vel sem posuere facilisis. Duis id elit condimentum"
        }]
        this.costumer = {
            name: "John Smith",
            lastSeen: "19:09"
        }
    }

    sendMessage() {

    }
}