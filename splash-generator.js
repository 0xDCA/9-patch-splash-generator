var $submitButton = $('#submitButton');
var $downloadButton = $('#downloadButton');
var $svgInput = $('#svgInput');
var $canvasContainer = $('#canvasContainer');
var $marginTop = $('#marginTop');
var $marginRight = $('#marginRight');
var $marginBottom = $('#marginBottom');
var $marginLeft = $('#marginLeft');

var $maxWidth = $('#maxWidth');
var $maxHeight = $('#maxHeight');

var targetSizes = {
  'drawable-port-ldpi-screen': {
    width: 240,
    height: 320,
  },
  'drawable-port-mdpi-screen': {
    width: 320,
    height: 480,
  },
  'drawable-port-hdpi-screen': {
    width: 480,
    height: 720,
  },
  'drawable-port-xhdpi-screen': {
    width: 720,
    height: 1280,
  },
  'drawable-port-xxhdpi-screen': {
    width: 960,
    height: 1600,
  },
  'drawable-port-xxxhdpi-screen': {
    width: 1280,
    height: 1920,
  },
};

function fillRectExact(imageData, x, y, width, height, color) {
  var columns = imageData.width;

  // Convert everything to int
  x = x | 0;
  y = y | 0;
  width = width | 0;
  height = height | 0;

  for (var i = 0; i < height; ++i) {
    for (var j = 0; j < width; ++j) {
      var pos = (y + i) * (columns * 4) + 4 * (x + j);
      imageData.data[pos] = color[0];
      imageData.data[pos + 1] = color[1];
      imageData.data[pos + 2] = color[2];
      imageData.data[pos + 3] = color[3];
    }
  }
}

function generateCanvases(download) {
  $canvasContainer.empty();

  var image = new Image();
  image.onload = function () {
    var globalMaxWidth = parseFloat($maxWidth.val());
    var globalMaxHeight = parseFloat($maxHeight.val());

    var marginLeft = parseFloat($marginLeft.val());
    var marginTop = parseFloat($marginTop.val());
    var marginRight = parseFloat($marginRight.val());
    var marginBottom = parseFloat($marginBottom.val());

    var canvases = {};

    for (var sizeName in targetSizes) {
      if (!targetSizes.hasOwnProperty(sizeName)) {
        continue;
      }

      var targetSize = targetSizes[sizeName];
      var $canvas = $('<canvas/>');
      canvases[sizeName] = $canvas[0];

      var contentWidth = targetSize.width;
      var contentHeight = targetSize.height;
      var canvasWidth = contentWidth + 2;
      var canvasHeight = contentHeight + 2;
      $canvas.attr('width', canvasWidth);
      $canvas.attr('height', canvasHeight);

      var context = $canvas[0].getContext('2d');

      // White background
      context.fillStyle = '#FFFFFF';
      context.fillRect(1, 1, contentWidth, contentHeight);

      // Find size
      var maxWidth = Math.min(contentWidth - marginLeft - marginRight, globalMaxWidth);
      var maxHeight = Math.min(contentHeight - marginTop - marginBottom, globalMaxHeight);

      var targetWidth;
      var targetHeight;
      var ratio;

      if (image.height > image.width) {
        ratio = image.width / image.height;
        targetHeight = maxHeight;
        targetWidth = targetHeight * ratio;
      } else {
        ratio = image.height / image.width;
        targetWidth = maxWidth;
        targetHeight = targetWidth * ratio;
      }

      var x = marginLeft + (contentWidth - marginLeft - marginRight - targetWidth) / 2 + 1;
      var y = marginTop + (contentHeight - marginTop - marginBottom - targetHeight) / 2 + 1;

      context.drawImage(image, x, y, targetWidth, targetHeight);

      // Draw 9-patch lines
      var pixelsToExtend = 2;
      var borderColor = [0, 0, 0, 0];

      var imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);

      // Transparent border
      fillRectExact(imageData, 0, 0, canvasWidth, 1, borderColor);
      fillRectExact(imageData, canvasWidth, 0, 1, canvasHeight, borderColor);
      fillRectExact(imageData, 0, canvasHeight, canvasWidth, 1, borderColor);
      fillRectExact(imageData, 0, 0, 1, canvasHeight, borderColor);

      borderColor = [0, 0, 0, 255];

      // Top
      fillRectExact(imageData, 1, 0, x - marginLeft - 1 + pixelsToExtend, 1, borderColor);
      fillRectExact(imageData, x + targetWidth + marginRight - pixelsToExtend, 0,
        contentWidth - x - targetWidth - marginRight + pixelsToExtend + 1, 1, borderColor);

      // Left
      fillRectExact(imageData, 0, 1, 1, y - marginTop - 1 + pixelsToExtend, borderColor);
      fillRectExact(imageData, 0, y + targetHeight + marginBottom - pixelsToExtend, 1,
        contentHeight - y - targetHeight - marginBottom + pixelsToExtend + 1, borderColor);

      context.putImageData(imageData, 0, 0);

      var $canvasItem = $('<div />');
      var $canvasTitle = $('<h3/>');
      $canvasTitle.text(sizeName);
      $canvasItem.append($canvasTitle);
      $canvasItem.append($canvas);

      $canvasContainer.append($canvasItem);
    }

    if (download) {
      var zip = new JSZip();
      var promises = [];

      for (var sizeName in targetSizes) {
        if (!targetSizes.hasOwnProperty(sizeName)) {
          continue;
        }

        let perIterationSizeName = sizeName;
        promises.push(
          new Promise(function (resolve, reject) {
            canvases[perIterationSizeName].toBlob(function addBlobToZip(blob) {
              zip.file(perIterationSizeName + '.9.png', blob);
              resolve();
            });
          }));
      }

      Promise.all(promises).then(function () {
        zip.generateAsync({
          type: 'blob',
        }).then(function (blob) {
          saveAs(blob, 'splash-screen.zip');
        });
      });
    }
  };

  var URL = window.URL;
  image.src = URL.createObjectURL($svgInput.prop('files')[0]);
}

$submitButton.on('click', function () {
  generateCanvases(false);
});

$downloadButton.on('click', function () {
  generateCanvases(true);
});
