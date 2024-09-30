document.addEventListener("DOMContentLoaded", function(event) {
  
  function OTPInput() {
const inputs = document.querySelectorAll('#otp > *[id]');
for (let i = 0; i < inputs.length; i++) { inputs[i].addEventListener('keydown', function(event) { if (event.key==="Backspace" ) { inputs[i].value='' ; if (i !==0) inputs[i - 1].focus(); } else { if (i===inputs.length - 1 && inputs[i].value !=='' ) { return true; } else if (event.keyCode> 47 && event.keyCode < 58) { inputs[i].value=event.key; if (i !==inputs.length - 1) inputs[i + 1].focus(); event.preventDefault(); } else if (event.keyCode> 64 && event.keyCode < 91) { inputs[i].value=String.fromCharCode(event.keyCode); if (i !==inputs.length - 1) inputs[i + 1].focus(); event.preventDefault(); } } }); } } OTPInput();

    
});
let timeLeft = 300; // 5 minutes in seconds

const timer = setInterval(() => {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    document.getElementById('timer').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    if (timeLeft <= 0) {
        clearInterval(timer);
        document.getElementById('timer').innerText = 'OTP expired. Please resend OTP.';
        // Disable OTP input and verify button
        document.getElementById('otpInput').disabled = true;
        document.getElementById('verifyButton').disabled = true;
    }

    timeLeft--;
}, 1000);


let resendDelay = 60; // 1 minute in seconds

const resendOtpTimer = setInterval(() => {
    if (resendDelay > 0) {
        document.getElementById('resendOtp').innerText = `Resend OTP in ${resendDelay}s`;
    } else {
        document.getElementById('resendOtp').innerText = 'Resend OTP';
        document.getElementById('resendOtp').disabled = false;
        clearInterval(resendOtpTimer);
    }

    resendDelay--;
}, 1000);