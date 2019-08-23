document.addEventListener("DOMContentLoaded", function(e) {

  var code;
  var domID = document.querySelector('.product-id');
  if (document.cookie && domID) {
    var idProduct;
    for (let item of document.cookie.split(';')) {
      item = item.split('=');
      if (item[0] === 'scan' || item[0] === ' scan') {
        idProduct = item[1];
        domID.innerHTML = idProduct;
      }
    }
    const req = new XMLHttpRequest();
    req.open('GET', ('https://world.openfoodfacts.org/api/v0/product/'+ idProduct +'.json'), false);
    req.send(null);

    var productInfos = JSON.parse(req.responseText);
    if (req.status === 200) {
      console.log(productInfos);

      document.querySelector('.product-infos').innerHTML = '' +
          '<h2>'+ productInfos.product.product_name +'</h2>' +
          '<h3>'+ productInfos.product.generic_name +'</h3>' +
          '<img src="'+ productInfos.product.image_front_url +'">' +
          '<p>Marque : ' + productInfos.product.brands +'</p>'+
          '<p>Origine : ' + productInfos.product.countries +'</p>' +
          '<p>Ingrédients : ' + productInfos.product.carbon_footprint_from_known_ingredients_debug +'</p>';
    }
  }

  var id = document.querySelector('.product--id');

  if (document.querySelector('.item-scanner')) {
    // Create the QuaggaJS config object for the live stream
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
    }
    var liveStreamConfig = {
      inputStream: {
        type: "LiveStream",
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          aspectRatio: { min: 1, max: 100 },
          facingMode: "environment" // or "user" for the front camera
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: navigator.hardwareConcurrency
          ? navigator.hardwareConcurrency
          : 4,
      decoder: {
        readers: [{ format: "ean_reader", config: {} }]
      },
      locate: true
    };
    var deepExtend = function(out) {
      out = out || {};
      for (var i = 1; i < arguments.length; i++) {
        var obj = arguments[i];
        if (!obj)
          continue;
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object')
              out[key] = deepExtend(out[key], obj[key]);
            else
              out[key] = obj[key];
          }
        }
      }
      return out;
    };

    // The fallback to the file API requires a different inputStream option.
    // The rest is the same
    var fileConfig = deepExtend({}, liveStreamConfig, {
      inputStream: {
        size: 800
      }
    });


    window.onload = function() {
      initScanner();
    };

    function initScanner() {
      Quagga.init(liveStreamConfig, function(err) {
        if (err) {
          var msg = document.querySelector('.error-msg-scanner');
          if (msg) {
            msg.style.display = 'block';
          }
          Quagga.stop();
          return;
        }
        Quagga.start();
      });
    }

    // Make sure, QuaggaJS draws frames an lines around possible
    // barcodes on the live stream
    Quagga.onProcessed(function(result) {
      var drawingCtx = Quagga.canvas.ctx.overlay,
          drawingCanvas = Quagga.canvas.dom.overlay;
      if (result) {
        if (result.boxes) {
          drawingCtx.clearRect(
              0,
              0,
              parseInt(drawingCanvas.getAttribute("width")),
              parseInt(drawingCanvas.getAttribute("height"))
          );
          result.boxes
              .filter(function(box) {
                return box !== result.box;
              })
              .forEach(function(box) {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                  color: "green",
                  lineWidth: 2
                });
              });
        }
        if (result.box) {
          Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
            color: "#00F",
            lineWidth: 2
          });
        }
        if (result.codeResult && result.codeResult.code) {
          Quagga.ImageDebug.drawPath(
              result.line,
              { x: "x", y: "y" },
              drawingCtx,
              { color: "red", lineWidth: 3 }
          );
        }
      }
    });

    // Once a barcode had been read successfully, stop quagga and
    // close the modal after a second to let the user notice where
    // the barcode had actually been found.
    Quagga.onDetected(function(result) {
      if (result.codeResult.code) {
        code = Number(result.codeResult.code);
        document.cookie = "scan=" + code;
        Quagga.stop();
        document.querySelector('.link-product').click();
      }
    });
  }



});