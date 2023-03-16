// seleciona o elemento de imagem
let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.onload = function() {
  let srcMat = cv.imread(imgElement);
  let grayImg = new cv.Mat();
  cv.cvtColor(srcMat, grayImg, cv.COLOR_RGBA2GRAY, 0);

  cv.GaussianBlur(grayImg, grayImg, { width: 3, height: 3 }, 0, 0, cv.BORDER_DEFAULT);

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

    const count = new Array(360).fill(0);

    const histogramPos = new Array(360).fill([0, 0]);

    // percorre todos os pixels da imagem
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // calcula a hipotenusa do ponto atual
        const hypotenuse = calcHypotenuse(x - centerX, y - centerY);

        // verifica se o ponto está dentro do círculo
        if (hypotenuse <= radius) {
          // calcula o ângulo do ponto atual em relação ao centro da imagem
          let angle = Math.atan2(y, x) * 180 / Math.PI;
          //let angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
          angle = angle < 0 ? angle + 360 : angle;

          // adiciona a intensidade do pixel atual ao histograma para o ângulo correspondente
          let pixel = image.ucharAt(y, x);
          histogram[Math.round(angle)] += (255 - pixel);
          count[Math.round(angle)]++;
          //histogramPos[Math.round(angle)] = [x, y];
        }
      }
    }

    // encontra o ângulo com a maior intensidade média
    function findMaxIntensityAngle(histogram, count, histogramPos, image) {
      let maxIntensity = 0;
      let maxX, maxY;
      let maxIndex = 0;

      for (let i = 0; i < histogram.length; i++) {
        if (count[i] > 0) {
          let intensity = histogram[i] / count[i];
          if (intensity > maxIntensity) {
            maxIntensity = intensity;
            maxIndex = i;
            //maxX = histogramPos[i][0];
           // maxY = histogramPos[i][1];

            maxX = centerX + radius * Math.cos((count[i] * Math.PI / 180));
            maxY = centerY + radius * Math.sin((count[i] * Math.PI / 180));
          }
        }
      }

      // desenha a linha indicando o ângulo com a maior intensidade média
      let x1 = centerX;
      let y1 = centerY;
      let x2 = maxX;
      let y2 = maxY;

      cv.line(image, new cv.Point(x1, y1), new cv.Point(x2, y2), [255, 0, 0, 255], 2);

      // atualiza a imagem exibida
      cv.imshow('canvasOutput', image);
    }

    findMaxIntensityAngle(histogram, count, histogramPos, image);

    grayImg.delete();
    srcMat.delete();
  }

  main(grayImg);
};