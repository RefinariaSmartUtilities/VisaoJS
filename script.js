// seleciona o elemento de imagem
let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

function recortaManometro(img) {

  // Dados vindos da leitura do QRCode (ENTRADA)
  //smartu6.jpg
  const qrTL = [1134, 1448 ]       // Top-Left do qrcode na imagem. [x, y]
  const qrTR = [1302, 1490 ]       // Top-Right do qrcode na imagem.
  const qrBL = [1122, 1623 ]       // Botton-Left do qrcode na imagem.
  const qrBR = [1292, 1663 ]       // Botton-Right do qrcode na imagem.

  // Dados conhecidos do manômetro e qrcode (ENTRADA)
  //smartu6.jpg
  const qrSize = 25             // Tamanho do qrcode em milimitros
  const distManQrX = 3          // Distância horizontal entre os centros do manômetro e qrcode
  const distManQrY = 45        // Distância vertical entre os centros do manômetro e qrcode
  const manSize = 40           // Diâmetro do manômetro em milimitros

  // Calcula escala da imagem transformada
  // TODO: dá para levar em conto a geometria do QRCode para estimar de forma mais precisa pixSize_trans
  const pixSize_trans = qrSize / Math.max(qrBL[1]-qrTL[1],qrBR[1]-qrTR[1])       // Tamanho do pixel (em mm) na imagem transformada
  const qrSeize_trans = qrSize/pixSize_trans                               // Tamanho em pixels do qrcode na imagem transformada

  // Define os pontos na imagem transformada. 
  // O QrCode deve virar um quadrado com vista frontal na imagem transformada.
  // A transformação é feita com centro em qrTL
  const qrTL_trans = qrTL
  const qrTR_trans = [qrTL[0] + qrSeize_trans, qrTL[1]]
  const qrBL_trans = [qrTL[0], qrTL[1] + qrSeize_trans]
  const qrBR_trans = [qrTR_trans[0], qrBL_trans[1]]

  // Computa a matriz de homografia
  let input_pts = cv.matFromArray(4, 1, cv.CV_32FC2, [qrTL[0], qrTL[1], qrTR[0], qrTR[1], qrBL[0], qrBL[1], qrBR[0], qrBR[1]])
  let output_pts = cv.matFromArray(4, 1, cv.CV_32FC2, [qrTL_trans[0], qrTL_trans[1], qrTR_trans[0], qrTR_trans[1], qrBL_trans[0], qrBL_trans[1], qrBR_trans[0], qrBR_trans[1]])
  let H = cv.getPerspectiveTransform(input_pts,output_pts)

  // Aplica a transformação
  let img_trans = new cv.Mat();
  cv.warpPerspective(img, img_trans, H, new cv.Size(img.rows, img.cols));

  // Calcula pontos da bounding box do manômetro na imagem transformada
  // Adiciona as distâncias horizontais e verticais entre o QrCode e o manômetro
  const manTL = [Math.round(qrTL_trans[0] + qrSeize_trans/2 - distManQrX/pixSize_trans - manSize/(2*pixSize_trans)), Math.round(qrTL_trans[1] + qrSeize_trans/2 - distManQrY/pixSize_trans - manSize/(2*pixSize_trans))]
  const manTR = [Math.round(qrTL_trans[0] + qrSeize_trans/2 - distManQrX/pixSize_trans + manSize/(2*pixSize_trans)), manTL[1]]
  const manBL = [manTL[0], Math.round(qrTL_trans[1] + qrSeize_trans/2 - distManQrY/pixSize_trans + manSize/(2*pixSize_trans))]
  const manBR = [manTR[0], manBL[1]]

  // Recorta só o manômetro
  let img_man = new cv.Mat()
  img_man = img_trans.roi(new cv.Rect(manTL[0], manTL[1], manBR[0]-manTL[0], manBR[1]-manTL[1]))

  // Mostra resultados
  //cv.imshow('canvasOutput', img_man);
  //cv.namedWindow('transformada', cv.WINDOW_NORMAL)
  //cv.imshow("transformada",img_trans)
  //cv.imshow("manometro", img_man)
  return img_man
}

// função para calcular a hipotenusa de um ponto (x, y)
function calcHypotenuse(x, y) {
  return Math.sqrt(x*x + y*y);
}

function calcHistogram(srcMat) {

  let image = new cv.Mat();

  cv.cvtColor(srcMat, image, cv.COLOR_RGBA2GRAY, 0);
  cv.GaussianBlur(image, image, { width: 3, height: 3 }, 0, 0, cv.BORDER_DEFAULT);

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

  // percorre todos os pixels da imagem
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      // calcula a hipotenusa do ponto atual
      const hypotenuse = calcHypotenuse(x - centerX, y - centerY);

      // verifica se o ponto está dentro do círculo
      if (hypotenuse <= radius) {

        // calcula o ângulo do ponto atual em relação ao centro da imagem
        let angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
        angle = angle < 0 ? angle + 360 : angle;

        // adiciona a intensidade do pixel atual ao histograma para o ângulo correspondente
        let pixel = image.ucharAt(y, x);
        histogram[Math.round(angle)] += (255 - pixel);
        count[Math.round(angle)]++;

      }
    }
  }
  
  // encontra o ângulo com a maior intensidade média
  let maxIntensity = 0;
  let maxX, maxY;
  let maxAngle = 0;

  for (let i = 0; i < histogram.length; i++) {
    if (count[i] > 0) {
      let intensity = histogram[i] / count[i];
      if (intensity > maxIntensity) {
        maxIntensity = intensity;
        maxAngle = i;

        maxX = centerX + radius * Math.cos((maxAngle * Math.PI / 180));
        maxY = centerY + radius * Math.sin((maxAngle * Math.PI / 180));
      }
    }
  }

  // desenha a linha indicando o ângulo com a maior intensidade média
  let x1 = centerX;
  let y1 = centerY;
  let x2 = maxX;
  let y2 = maxY;

  return {x1, y1, x2, y2, maxAngle}
  
}



imgElement.onload = function() {

  // carrega imagem
  let img = cv.imread(imgElement);
  
  let srcMat = recortaManometro(img);
  
  let {x1, y1, x2, y2, maxAngle} = calcHistogram(srcMat);
  
  console.log('Angulo: ', maxAngle)

  // atualiza a imagem exibida
  cv.line(srcMat, new cv.Point(x1, y1), new cv.Point(x2, y2), [255, 0, 0, 255], 2);
  cv.imshow('canvasOutput', srcMat);

  // limpa memoria cache
  srcMat.delete();
};