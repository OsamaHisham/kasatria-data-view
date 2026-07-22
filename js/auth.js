// Called by the GIS <script> tag's onload attribute in index.html
function initGoogleSignIn() {
  if (typeof GOOGLE_CLIENT_ID === "undefined") {
    document.getElementById("configWarning").classList.remove("hidden");
    return;
  }

  if (sessionStorage.getItem("kasatriaUser")) {
    window.location.replace("main.html");
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: onCredentialResponse,
  });

  google.accounts.id.renderButton(document.getElementById("googleButton"), {
    type: "standard",
    theme: "filled_blue",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    logo_alignment: "right",
  });
}

function onCredentialResponse(response) {
  console.log("Full response object:", response);
  console.log("Raw JWT credential (paste this into jwt.io):", response.credential);

  const claims = decodeJwtPayload(response.credential);
  console.log("Decoded claims:", claims);


  sessionStorage.setItem(
    "kasatriaUser",
    JSON.stringify({
      name: claims.name,
      email: claims.email,
      picture: claims.picture,
    })
  );

  window.location.href = "main.html";
}

// The credential is a JWT whose payload is base64url-encoded UTF-8.
// JWT = header.payload.signature
function decodeJwtPayload(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const jsonBytes = atob(base64);

  return JSON.parse(jsonBytes);

  // const json = decodeURIComponent(
  //   Array.from(bytes, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
  // );

  // return JSON.parse(json);
}

// Handles keeping user at main page when logged in
window.addEventListener("pageshow", () => {
  if (sessionStorage.getItem("kasatriaUser")) {
    window.location.replace("main.html");
  }
});