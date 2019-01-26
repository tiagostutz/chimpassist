# widget

Looks and sotres at `window.localStorage.userData` for customer info. So, if you have a logged application and wants the chat widget to use your logged customer information, just put the following object at localStorage before adding `<ChimpWidget>`:

```JS

let userData = {
    "name": LOGGED_USER_NAME_FROM_YOUR_SITE,
    "id": LOGGED_USER_ID_FROM_YOUR_SITE,
    "avatarURL": LOGGED_USER_AVATAR_FROM_YOUR_SITE
}
window.localStorage.userData = JSON.stringify(userData)

```