/*
  Name of File: contact.js
  Created: Apr 1st, 2026
  Created By: Claude and Uncle Burnie (aka Computer Genius)
  Changes Made: Initial build - handles contact form submission, posts to ContactCode.gs
                web app (Google Apps Script) which emails Patti and texts her phone.

  SETUP REQUIRED:
  1. Deploy ContactCode.gs as a Google Apps Script Web App (Deploy > New deployment > Web app,
     Execute as: Me, Who has access: Anyone).
  2. Copy the deployment URL and paste it below as SCRIPT_URL.
*/

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6ZusC88M-DqkdVuI-zdvoQQnL66dMNPDrrUW6N-Kkh9nXLndg5M07XxQB7QWB_2djQw/exec";

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusBox = document.getElementById('form-status');
  const successState = document.getElementById('form-success');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    statusBox.classList.remove('show', 'success', 'error');
    statusBox.textContent = '';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();

    const interestChecks = form.querySelectorAll('input[name="interest"]:checked');
    const interests = Array.from(interestChecks).map(function (cb) { return cb.value; });

    if (!name || !email || !message) {
      statusBox.textContent = 'Please fill in your name, email, and message.';
      statusBox.classList.add('show', 'error');
      return;
    }

    if (SCRIPT_URL.indexOf('PASTE_YOUR') !== -1) {
      statusBox.textContent = 'Form backend is not yet connected. (SCRIPT_URL needs to be set in contact.js)';
      statusBox.classList.add('show', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const payload = new URLSearchParams({
      name: name,
      email: email,
      phone: phone,
      interests: interests.join(', ') || 'Not specified',
      message: message,
      pageUrl: window.location.href,
      submittedAt: new Date().toLocaleString()
    });

    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString()
    })
      .then(function () {
        // no-cors responses are opaque; treat completion as success
        form.style.display = 'none';
        successState.classList.add('show');
      })
      .catch(function (err) {
        console.error('Contact form submission error:', err);
        statusBox.textContent = 'Something went wrong sending your message. Please try again, or call/email Patti directly.';
        statusBox.classList.add('show', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      });
  });
});
