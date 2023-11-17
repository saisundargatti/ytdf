document.addEventListener("DOMContentLoaded", function () {
  const submitButton = document.getElementById("submit-button");
  // Function to make an API call to get the transcript
  async function fetchTranscript(youtubeURL) {
    try {
      // Show the loader while the API call is in progress
      submitButton.innerText = "Loading..";

      // Disable the button while the API call is in progress
      submitButton.disabled = true;

      const payload = {
        youtubeURL: youtubeURL,
      };
      let url = "http://127.0.0.1:5000";

      let response = await fetch(`${url}/download_transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      switch (data.message) {
        case "Processed successfully":
          // If the transcript is available, set the transcript
          document.getElementById("transcript").value = data.results;
          document.getElementById("error").innerText = ""; // Clear any previous errors
          break;

        case "No Transcript":
          // If no transcript is available, set an error message
          document.getElementById("transcript").value = "";
          document.getElementById("error").innerText = "No Transcript";
          break;

        case "Invalid YouTube URL or video ID not found.":
          // Handle the case of an invalid YouTube URL or video ID not found
          document.getElementById("transcript").value = "";
          document.getElementById("error").innerText =
            "Invalid YouTube URL or video ID not found.";
          break;

        default:
          // Handle any other unexpected cases
          document.getElementById("transcript").value = "";
          document.getElementById("error").innerText = "Unexpected error";
          console.error("Unexpected response:", data);
      }
    } catch (error) {
      // Handle unexpected errors during the API call
      document.getElementById("transcript").value = "";
      document.getElementById("error").innerText =
        "Unexpected error during API call";
      console.error("Unexpected error details:", error);
    } finally {
      submitButton.innerText = "Submit";
      // Re-enable the button
      submitButton.disabled = false;
    }
  }

  // Event listener for the "Submit" button
  document
    .getElementById("submit-button")
    .addEventListener("click", function () {
      const youtubeURL = document.getElementById("youtube-url").value;
      fetchTranscript(youtubeURL); // Call the function to make the API call
    });

  // JavaScript code for formatting the transcript
  document
    .getElementById("formatButton")
    .addEventListener("click", function () {
      const transcript = document.getElementById("transcript").value;
      formatTranscript(transcript, 7); // Use the same function for both cases
      updateCharacterAndWordCounts();
    });

  document
    .getElementById("downloadButton")
    .addEventListener("click", function () {
      // Get the text content
      const formattedTranscript = document.getElementById(
        "formattedTranscript"
      ).innerText;

      // Encode content as a Blob
      const docBlob = new Blob([formattedTranscript], {
        type: "application/msword",
      });

      // Create a data URI for the Blob
      const docDataUri = URL.createObjectURL(docBlob);

      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = docDataUri;
      downloadLink.download = "transcript.doc"; // Specify the file name with an .doc extension
      downloadLink.style.display = "none";

      // Append the link to the document
      document.body.appendChild(downloadLink);

      // Simulate a click event to trigger the download
      downloadLink.click();

      // Clean up by removing the hidden download link
      document.body.removeChild(downloadLink);
    });

  // JavaScript code for copying the formatted transcript to clipboard
  document.getElementById("copyButton").addEventListener("click", function () {
    const formattedTranscript = document.getElementById(
      "formattedTranscript"
    ).innerText;
    const plainTextTranscript = formattedTranscript.replace(/<[^>]*>/g, "");
    copyToClipboard(plainTextTranscript);
  });

  //Javascript to clear

  document.getElementById("clearButton").addEventListener("click", function () {
    document.getElementById("transcript").value = ""; // Clear the textarea
    document.getElementById("formattedTranscript").innerHTML = ""; // Clear the content of the <div>
    document.getElementById("charCount").innerHTML = "0"; // Update innerHTML for charCount
    document.getElementById("wordCount").innerHTML = "0"; // Update innerHTML for wordCount
    document.getElementById("youtube-url").value = "";
  });

  function formatTranscript(transcript, sentencesPerParagraph) {
    // Use Compromise to parse the transcript and add periods where needed
    const transcriptWithPeriods = nlp(transcript).sentences().out("text");

    // Split the transcript into paragraphs based on line breaks
    const paragraphs = transcriptWithPeriods
      .split("\n")
      .map((paragraph) => paragraph.trim());

    // Initialize an array for formatted paragraphs
    const formattedParagraphs = [];

    // Initialize variables to track the current paragraph and sentence count
    let currentParagraph = "";
    let sentenceCount = 0;

    for (const paragraph of paragraphs) {
      // Count sentences in the current paragraph
      const sentencesInParagraph = nlp(paragraph)
        .sentences()
        .out("array").length;

      // Check if adding the current paragraph would exceed the desired sentence count
      if (sentenceCount + sentencesInParagraph > sentencesPerParagraph) {
        // Push the current paragraph to the formattedParagraphs array
        if (currentParagraph) {
          formattedParagraphs.push(`<p>${currentParagraph}</p>`);
        }
        // Reset the current paragraph and sentence count
        currentParagraph = paragraph;
        sentenceCount = sentencesInParagraph;
      } else {
        // Append the current paragraph and update the sentence count
        currentParagraph += ` ${paragraph}`;
        sentenceCount += sentencesInParagraph;
      }
    }

    // Push the last paragraph to the formattedParagraphs array
    if (currentParagraph) {
      formattedParagraphs.push(`<p>${currentParagraph}</p>`);
    }

    // Get the formattedTranscript container
    const formattedContainer = document.getElementById("formattedTranscript");

    // Clear any existing content in the container
    formattedContainer.innerHTML = "";

    // Insert paragraphs into the formattedTranscript container
    formattedParagraphs.forEach((paragraph) => {
      formattedContainer.insertAdjacentHTML("beforeend", paragraph);
    });
  }
  // Function to count characters in the formatted transcript
  function countCharacters(text) {
    return text.length;
  }

  // Function to count words in the formatted transcript
  function countWords(text) {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  // Function to update character and word counts
  function updateCharacterAndWordCounts() {
    const formattedTranscript = document.getElementById(
      "formattedTranscript"
    ).textContent;
    const charCount = countCharacters(formattedTranscript);
    const wordCount = countWords(formattedTranscript);

    // Update the counts in the HTML elements
    document.getElementById("charCount").textContent = charCount;
    document.getElementById("wordCount").textContent = wordCount;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.innerText = message;

    // Show the toast
    toast.style.display = "block";

    // Automatically hide the toast after 3 seconds (adjust the duration as needed)
    setTimeout(function () {
      toast.style.display = "none";
    }, 2000); // Toast disappears after 3 seconds
  }

  function copyToClipboard(text) {
    // Use the navigator.clipboard.writeText method to copy the text to the clipboard
    navigator.clipboard.writeText(text).then(
      function () {
        // Call the showToast function to display a toast message
        showToast("Copied to Clipboard");
      },
      function (err) {
        console.error("Could not copy text: ", err);
      }
    );
  }
  // Select all FAQ question elements
  const faqQuestions = document.querySelectorAll(".faq-question");

  // Add a click event listener to each FAQ question
  faqQuestions.forEach(function (question, index) {
    question.addEventListener("click", function () {
      toggleAnswer(index + 1); // Call the toggleAnswer function with the corresponding ID
    });
  });

  function toggleAnswer(id) {
    const answer = document.getElementById(`answer${id}`);
    answer.classList.toggle("show-answer");
  }

  const bookmarkButton = document.getElementById("bookmarkButton");
  const toastContainer = document.getElementById("your-toast-container");
  const toastMessage = document.getElementById("your-toast-message");

  bookmarkButton.addEventListener("click", () => {
    showToast("Press Ctrl + D to bookmark");
  });

  function showToast(message) {
    toastMessage.innerText = message;
    toastContainer.style.top = "0";
    toastContainer.style.display = "block";
    setTimeout(() => {
      toastContainer.style.top = "-100px";
      setTimeout(() => {
        toastContainer.style.display = "none";
      }, 500);
    }, 2000);
  }
});
