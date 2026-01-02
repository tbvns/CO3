import { fetchLoginAuthenticityToken } from './fetchAuthenticityToken';

export default async function login(username, password) {
  try {
    // Prepare the form data
    const formData = new FormData();
    formData.append('authenticity_token', await fetchLoginAuthenticityToken());
    formData.append('user[login]', username);
    formData.append('user[password]', password);
    formData.append('user[remember_me]', '1');
    formData.append('commit', 'Log in');

    // Send the login request
    const response = await fetch('https://archiveofourown.org/users/login', {
      method: 'POST',
      body: formData,
      credentials: 'include', // Important for cookies
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Referer: 'https://archiveofourown.org/users/login',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }, //Yea cloudflare was hard on this one, so i'm officially a web browser YaY
      //Like fr i'm a win 10 machine on chrome wdym
      //We just need to pray cloudflare will leave me alone
    });

    if (response.url === 'https://archiveofourown.org/users/login') {
      throw new Error('Wrong username or password');
    }

    // Extract the session cookie from the response headers
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Look for the otwarchive session cookie
      const cookies = setCookieHeader.split(',');
      for (let cookie of cookies) {
        const trimmedCookie = cookie.trim();
        if (
          trimmedCookie.includes('otwarchive') &&
          trimmedCookie.includes('session=')
        ) {
          // Extract the session value
          const sessionMatch = trimmedCookie.match(/session=([^;]+)/);
          if (sessionMatch) {
            return sessionMatch[1]; // Return the session cookie value
          }
        }
      }
    }

    if (response.ok) {
      if (
        response.redirected ||
        response.url !== 'https://archiveofourown.org/users/login'
      ) {
        console.log(
          'Login appears successful but session cookie not found in headers',
        );
        return null;
      }
    }

    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

//Ok so this methode to check if the cookie is valid is horrendous
//I swear the way this website is coded makes me want to kms
//Basically what we do here is provide a token to the website and say we are authenticated
//But if the token is invalid the website will strip some cookies
//We detect that to guess if the cookie is valid or not.
//And guess is a very important word in this sentence lmao.
export async function validateCookie(sessionToken) {
  try {
    // Send a request to the website with the provided cookies
    const response = await fetch('https://archiveofourown.org/', {
      method: 'GET',
      credentials: 'include', // Include cookies in the request
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': `user_credentials=1; _otwarchive_session=${sessionToken}` // Attach both cookies
      }
    });

    // Check the response headers for the "set-cookie" header
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Look for the "user_credentials" cookie being cleared
      const cookies = setCookieHeader.split(',');
      for (let cookie of cookies) {
        const trimmedCookie = cookie.trim();
        if (trimmedCookie.startsWith('user_credentials=') && trimmedCookie.includes('max-age=0')) {
          console.log("Cookie invalid !")
          return false;
        }
      }
    }

    console.log("Cookie verified !")

    // If the "user_credentials" cookie is not cleared, the token is valid
    return true;

  } catch (error) {
    console.error('Error validating cookie:', error);
    throw error;
  }
}
