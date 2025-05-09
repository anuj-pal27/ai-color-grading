document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    const uploadArea = document.getElementById("uploadArea");
    const imageInput = document.getElementById("imageInput");
    const enhanceBtn = document.getElementById("enhanceBtn");
    const resultSection = document.getElementById("resultSection");
    const originalImage = document.getElementById("originalImage");
    const enhancedImage = document.getElementById("enhancedImage");
    const enhancedImg = document.getElementById("enhancedImg");
    const loadingSpinner = document.querySelector(".loading-spinner");
    const errorMessage = document.querySelector(".error-message");
    const downloadBtn = document.getElementById("downloadBtn");
    const regenerateBtn = document.getElementById("regenerateImg");
    const previewContainer = document.getElementById("previewContainer");
    const uploadButton = document.querySelector(".btn-upload");
    
    // Setup regenerate button functionality
    function setupRegenerateButton() {
        regenerateBtn.onclick = () => {
            // Clear the image sections
            originalImage.src = "";
            enhancedImage.src = "";
            enhancedImg.src = "";
            // Hide result section and preview
            previewContainer.style.display = "none";
            resultSection.style.display = "none";
            downloadBtn.style.display = "none";
            regenerateBtn.style.display = "none";

            // Clear file input
            imageInput.value = "";

            // Show the upload area again
            uploadArea.style.display = "flex";
        };
    }

    // Set up the regenerate button as soon as the DOM is loaded
    setupRegenerateButton();

    // FAQ Accordion functionality
    function faqAccordion() {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            // Initially hide all answers
            answer.style.display = 'none';
            
            question.addEventListener('click', function() {
                // Toggle active class
                item.classList.toggle('active');
                
                // Toggle display of answer
                if (answer.style.display === 'none') {
                    answer.style.display = 'block';
                } else {
                    answer.style.display = 'none';
                }
            });
        });
    }
    
    faqAccordion();

    // Click on upload area to trigger file input 
    if(uploadArea){
        uploadArea.addEventListener('click',(e)=>{
            if(!e.target.closest('.btn-upload')){
                imageInput.click();
            }
        });
    }

    if(uploadButton){
        uploadButton.addEventListener('click',(e)=>{
            e.stopPropagation();
            imageInput.click();
        });
    }
    // file input change event
    if(imageInput){
        imageInput.addEventListener('change',(e)=>{
        const file = e.target.files[0];
        if(file){
            handleFile(file);
        }
        })
    }

  // Drag and drop functionality
  if (uploadArea) {
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    });
  }

  // Handle file input
  function handleFile(file){
    if(!file.type.match("image.*")){
        alert("Please select an image file");
        return;
    }
    const reader = new FileReader();
    console.log("reader",reader);
    reader.onload = function(e){
      originalImage.src = e.target.result;
      enhancedImg.src = e.target.result;
      previewContainer.style.display = "block";
      resultSection.style.display = "block";
      uploadArea.style.display = "none"; // Hide upload area after file is selected
      regenerateBtn.style.display = "block"; // Make regenerate button visible
    }
    reader.readAsDataURL(file);
  }

  // Helper function to convert file to base64 with data URI prefix
  function toBase64WithPrefix(file){
    return new Promise((resolve,reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>{
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  // Enhance button click event
  if(enhanceBtn){
    enhanceBtn.addEventListener('click',async()=>{
        if(!imageInput.files || imageInput.files.length === 0){
            alert("Please select an image first");
            return;
        }
        const file = imageInput.files[0];
        loadingSpinner.style.display = "flex";
        errorMessage.style.display = "none";

        try{
            const base64Image = await toBase64WithPrefix(file);
            console.log("Sending requrest to AWS lambda with:",{
                function:"color-grading",
                imaageLength: base64Image.length,
                imageFormat: base64Image.substring(0,50) + "...",
            });

            const response = await fetch("https://4kdc9rr2a2.execute-api.us-east-1.amazonaws.com/default/imageGenerationEndpoints",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    Accept:"application/json",
                },
                body: JSON.stringify({
                    function:"color-grading",
                    image: base64Image,
                }),
            });
            if(!response.ok){
                throw new Error("Image failed to generate. Please try again.");
        }
            const result = await response.json();

            if(result.status === "error"){
                throw new Error("Image processing failed! please try again. ");
            }
            if (!result.cloudinaryUrl) {
                throw new Error("Image processing failed! please try again.");
              }

        function enhanceCloudinaryUrl(url) {
            return url.replace(
              "/upload/",
               "/upload/q_100,f_auto/"
            );
          }
  
          // Display the enhanced image using the Cloudinary URL
          const enhancedUrl = enhanceCloudinaryUrl(result.cloudinaryUrl);
          enhancedImage.src = enhancedUrl;
          enhancedImg.src = enhancedUrl;
          loadingSpinner.style.display = "none";
          function makeDownloadableUrl(url) {
            return url.replace(
              "/upload/",
              "/upload/fl_attachment,q_auto:best,f_auto,dpr_auto/"
            );
          }
  
          // Enable download button
          if (downloadBtn) {
            downloadBtn.style.display = "block";
            downloadBtn.onclick = () => {
              const downloadableUrl = makeDownloadableUrl(result.cloudinaryUrl);
              const a = document.createElement("a");
              a.href = downloadableUrl;
              a.download = "enhanced_image.jpg";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            };
          }
        } catch (error) {
            console.error("Error enhancing image:", err);
            loadingSpinner.style.display = "none";
            if (errorMessage) {
              errorMessage.style.display = "flex";
              errorMessage.querySelector("p").textContent =
                "Failed to enhance image. Please try again.";
            }
        }
  })}

});
