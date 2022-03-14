//referencia al propio canvas
var canvas;
var ctx;
var FPS = 50;

// tamaño del tabero o escenario
var columnas= 25;
var filas= 25;
var escenario;  //matriz del nivel

//mozaicos o cuadritos
var anchoT;
var altoT;

const muro = '#000000';
const tierra = '#777777';

//elementos propios de la ruta
var principio;
var fin;

var openSet = [];//verde
var closedSet = [];//rojo

var camino = [];
var terminado = false;

// Creamos un array 2D
//fila,columna ->parametros
function creaArray2D(f,c){
  var obj = new Array(f);// creeamos el array -> filas (f)
  for(a=0; a<f; a++){
    obj[a] = new Array(c);// ahora creamos las columnas del array
  }
  return obj;
}

//funcion heuristica, diatancia mas corta en linea recta
function heuristica(a,b){
  var x = Math.abs(a.x - b.x);//abs-> valor absoluto, diatncias positivas
  var y = Math.abs(a.y - b.y);

  var dist = x+y;

  return dist;// retorna la distancia
}

//funcion para obtener una posicion en concreto y luego borrarla en el Array
function borraDelArray(array,elemento){
//desde el final
  for(i=array.length-1; i>=0; i--){
    if(array[i] == elemento){
      array.splice(i,1);
    }
  }
}

//posicion de casilla
function Casilla(x,y){

  //posicion
  this.x = x;
  this.y = y;

  //tipo,obstaculo=1 o si esta vacio=0 (peso o muro)
  this.tipo = 0;

  //saca valor randoom entre 0 y 4
  var aleatorio = Math.floor(Math.random()*5);
  if(aleatorio == 1)
      this.tipo = 1;

  //PESOS
  this.f = 0;  //coste total (g+h)
  this.g = 0;  //pasos dados
  this.h = 0;  // heuristica ( estimacion en linea recta que tan lejos     estamos del destino )

  this.vecinos = [];
  this.padre = null;

  //metodo que calcule los vecinos
  this.addVecinos = function(){
    if(this.x > 0)
      this.vecinos.push(escenario[this.y][this.x-1]);   //vecino izquierdo

    if(this.x < filas-1)
      this.vecinos.push(escenario[this.y][this.x+1]);   //vecino derecho

    if(this.y > 0)
      this.vecinos.push(escenario[this.y-1][this.x]);   //vecino de arriba

    if(this.y < columnas-1)
      this.vecinos.push(escenario[this.y+1][this.x]); //vecino de abajo
  }

  //dubuja las casillas
  this.dibuja = function(){
    var color;

    if(this.tipo == 0)
      color = tierra;

    if(this.tipo == 1)
      color = muro;

    //dibujamos el cuadro de canvas
    ctx.fillStyle = color;
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }

  //depurar
  //dibujamos openset
  this.dibujaOS = function(){
    ctx.fillStyle = '#008000';
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }

  //dibujamos closedset
  this.dibujaCS = function(){
    ctx.fillStyle = '#800000';
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }

  //dibujamos camino
  this.dibujaCamino = function(){
    ctx.fillStyle = '#00FFFF';  //cyan
    ctx.fillRect(this.x*anchoT,this.y*altoT,anchoT,altoT);
  }

}

function inicializa(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  //CALCULAMOS EL TAMAÑO DE LOS TILES (Proporcionalmente)
  anchoT = parseInt(canvas.width/columnas);
  altoT = parseInt(canvas.height/filas);

  //Creamos la matriz
  escenario = creaArray2D(filas,columnas);

  //añadimos los objetos casillas
  for(i=0;i<filas;i++){
    for(j=0;j<columnas;j++){
        escenario[i][j] = new Casilla(j,i)
    }
  }

//añadimos los vecinos
  for(i=0;i<filas;i++){
    for(j=0;j<columnas;j++){
        escenario[i][j].addVecinos();
    }
  }

  //CREAMOS ORIGEN Y DESTINO DE LA RUTA
  principio = escenario[0][0];
  fin = escenario[columnas-1][filas-1];

  //INICIALIZAMOS OPENSET
  openSet.push(principio);

  //EMPEZAMOS A EJECUTAR EL BUCLE PRINCIPAL
  setInterval(function(){principal();},1000/FPS);
}

function dibujaEscenario(){
  for(i=0;i<filas;i++){
    for(j=0;j<columnas;j++){
        escenario[i][j].dibuja();
    }
  }

  //dibuja openset
  for(i=0; i<openSet.length; i++){
    openSet[i].dibujaOS();
  }

  //dibuja closedset
  for(i=0; i<closedSet.length; i++){
    closedSet[i].dibujaCS();
  }
  //dibuja camino
  for(i=0; i<camino.length; i++){
    camino[i].dibujaCamino();
  }
}

//se actualice bien al refrescar la pagina
function borraCanvas(){
  canvas.width = canvas.width;
  canvas.height = canvas.height;
}

function algoritmo(){

  //hasta que termine se siguen haciendo calculos
  //hasta encontrar la slucion
  if(terminado != true){

    //SEGUIMOS SI HAY AlGO EN OPENSET
    if(openSet.length>0){
      var ganador = 0;  //índie o posición dentro del array openset del ganador

      //evaluamos que OpenSet tiene un menor coste / esfuerzo
      for(i=0; i<openSet.length; i++){
        if(openSet[i].f < openSet[ganador].f){
          ganador = i;
        }
      }

      //Analizamos la casilla ganadora
      var actual = openSet[ganador];

      //camino azul
      //SI HEMOS LLEGADO AL FINAL BUSCAMOS EL CAMINO DE VUELTA
      if(actual === fin){

        var temporal = actual;
        camino.push(temporal);

        while(temporal.padre!=null){
          temporal = temporal.padre;
          camino.push(temporal);
        }

        console.log('camino encontrado');
        terminado = true;
      }

      //SI NO HEMOS LLEGADO AL FINAL, SEGUIMOS
      else{
        borraDelArray(openSet,actual);
        closedSet.push(actual);

        var vecinos = actual.vecinos;

        //RECORRO LOS VECINOS DE MI GANADOR
        for(i=0; i<vecinos.length; i++){
          var vecino = vecinos[i];

          //SI EL VECINO NO ESTÁ EN CLOSEDSET Y NO ES UNA PARED, HACEMOS LOS CÁLCULOS
          if(!closedSet.includes(vecino) && vecino.tipo!=1){
            var tempG = actual.g + 1;

            //si el vecino está en OpenSet y su peso es mayor
            if(openSet.includes(vecino)){
              if(tempG < vecino.g){
                vecino.g = tempG;     //camino más corto
              }
            }
            else{
              vecino.g = tempG;
              openSet.push(vecino);//lo añadimos a la lista para analizar
            }

            //ACTUALIZAMOS VALORES
            vecino.h = heuristica(vecino,fin);
            vecino.f = vecino.g + vecino.h;

            //GUARDAMOS EL PADRE (DE DÓNDE VENIMOS)
            vecino.padre = actual;
          }
        }
      }
    }

    else{
      console.log('No hay un camino posible');
      terminado = true;   //el algoritmo ha terminado
    }
  }
}

//main
function principal(){
  borraCanvas();
  algoritmo();
  dibujaEscenario();
}
