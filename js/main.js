const storedUser = sessionStorage.getItem("kasatriaUser");

if (!storedUser) {
  window.location.replace("index.html");
} else {
  const user = JSON.parse(storedUser);

  document.getElementById("userName").textContent = user.name;
  document.getElementById("userEmail").textContent = user.email;
  document.getElementById("userPicture").src = user.picture;

  document.getElementById("signOut").addEventListener("click", () => {
    sessionStorage.removeItem("kasatriaUser");
    window.location.replace("index.html");
  });
}
