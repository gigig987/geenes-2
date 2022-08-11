const { setToken, removeToken } = geenes();
function ciao () {
  console.log('ciao', document)
  removeToken()
}
setToken("--color-rnd", "hsl("+ Math.random() * 360 +"deg, 50%, 40%)");
// setInterval(ciao, 5000);
// const elm = document.createElement('p');
console.log(window.frames)