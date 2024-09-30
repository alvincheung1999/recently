const clientId = "40fa62a160f94d5ebdb1444834176b9c"; // Replace with your client id
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

export async function main() {
    if (!code) {
      redirectToAuthCodeFlow(clientId);
    } else {
      try {
        const accessToken = await getAccessToken(clientId, code);
        const profile = await fetchProfile(accessToken);
        const tracks = await getTopTracks(accessToken);
        populateUI(profile, tracks);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  }
  
main();

export async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "https://alvincheung1999.github.io/recently");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "https://alvincheung1999.github.io/recently");
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    console.log(access_token);
    return access_token;
}

async function fetchProfile(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    console.log(result.status);

    return await result.json();
}

async function getTopTracks(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=30", {
        method: "GET", headers: { Authorization: `Bearer ${token}`}
    });

    console.log(result.status);

    return await result.json();
}

function populateUI(profile: any, tracks: any) {
    document.getElementById("displayName")!.innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar")!.appendChild(profileImage);
    }
    document.getElementById("id")!.innerText = profile.id;
    document.getElementById("email")!.innerText = profile.email;
    document.getElementById("uri")!.innerText = profile.uri;
    document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url")!.innerText = profile.href;
    document.getElementById("url")!.setAttribute("href", profile.href);
    document.getElementById("imgUrl")!.innerText = profile.images[0]?.url ?? '(no profile image)';
    
    const trackListElement = document.getElementById('trackList');
    const coverArt = document.getElementById('art');
    for (let i = 0; i < tracks.items.length; i++) {
        const track = tracks.items[i];
        
        // Create li element
        const listItem = document.createElement('li');

        const art = new Image(64, 64);
        art.src = track.album.images[0].url;
        const artElement = document.createElement('li');
        artElement.appendChild(art)
        coverArt?.appendChild(artElement);
        
        // Create a element for the track name
        const nameLink = document.createElement('a');
        nameLink.textContent = track.name;
        nameLink.href = track.external_urls.spotify;

        
        // Append a element to li element
        listItem.appendChild(nameLink);
        listItem.append(' by ' + track.artists[0].name);

        for (let j = 1; j < track.artists.length; j++) {
            listItem.append(', ' + track.artists[j].name);
        }
         
        // Append li element to ul element
        trackListElement?.appendChild(listItem);
    }
}

// TO ADD: 24 HOUR HEATGRAPH