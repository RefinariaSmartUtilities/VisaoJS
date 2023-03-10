let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);
imgElement.onload = function() {
  let srcMat = cv.imread(imgElement);
  let grayImg = new cv.Mat();
  cv.cvtColor(srcMat, grayImg, cv.COLOR_RGBA2GRAY, 0);
  
  // função para calcular a hipotenusa de um ponto (x, y)
  function calcHypotenuse(x, y) {
    return Math.sqrt(x*x + y*y);
  }

  function main(image) {
    // obtém as dimensões da imagem
    const rows = image.rows;
    const cols = image.cols;

    // calcula o centro da imagem
    const centerX = cols / 2;
    const centerY = rows / 2;

    // calcula o raio do círculo
    const radius = Math.min(rows, cols) / 2;

    // cria um histograma para armazenar a intensidade dos pixels para cada ângulo
    const histogram = new Array(360).fill(0);

    const count = new Array(360).fill(0)

    const histogramPos = new Array(360).fill(0);
    

    // percorre todos os pixels da imagem
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // calcula a hipotenusa do ponto atual
        const hypotenuse = calcHypotenuse(x - centerX, y - centerY);
        
        let aux = [];

        // verifica se o ponto está dentro do círculo
        if (hypotenuse <= radius) {
          // calcula o ângulo do ponto atual em relação ao centro da imagem
          let angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
          angle = Math.trunc(angle)

          if (angle < 0){
                angle = angle + 360
            }

          //console.log('angle: ', angle)

          // adiciona a intensidade do pixel atual ao histograma para o ângulo correspondente
          let pixel = image.ucharAt(x, y);
          //console.log('pixel: ',pixel)

          aux.push(x)
          aux.push(y)
          //console.log('aux: ',aux)

          histogram[angle] += (255 - pixel)
          //histogram[angle] = (pixel)

          count[angle]++;

          histogramPos[angle] = aux

          
        }
      }
    }

    
    // encontra o ângulo com a maior intensidade média
      let maxIntensity = 0;
      let maxX, maxY;
      let pos = 0

      for (let i = 0; i < histogram.length; i++) {
        //console.log('I: ',histogram[i]);
        if (histogram[i]/count[i] > maxIntensity) {
          console.log('histogram I: ', histogram[i])

          maxIntensity = histogram[i]/count[i];
          console.log('itensidade: ', maxIntensity)

          maxIndex = i
          console.log('maxIndex: ', i)

          maxX = histogramPos[i][0]
          maxY = histogramPos[i][1]
        }
      }
        
        
      // encontra o ponto mais distante
      maxPoint = { x: maxX, y: maxY };
      console.log('Ponto mais distante: ', maxPoint);
      //let center = new cv.Point(159, 169); //Image 01
      let center = new cv.Point(155, 159); //Image 02
      cv.line(image, center, maxPoint, [0, 0, 255, 255], 2);
      return maxPoint;
  }
  /////////////////////
  main(grayImg)
  cv.imshow('canvasOutput', grayImg);

  grayImg.delete();
  srcMat.delete();
};