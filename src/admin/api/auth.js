export default async (req, res) => {
	const { code } = req.query;
	
	if (!code) {
	  return res.status(400).json({ error: 'No code provided' });
	}
  
	const clientId = process.env.DECAP_CLIENT_ID;
	const clientSecret = process.env.DECAP_CLIENT_SECRET;
  
	try {
	  const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		  'Accept': 'application/json',
		},
		body: JSON.stringify({
		  client_id: clientId,
		  client_secret: clientSecret,
		  code,
		}),
	  });
  
	  const data = await response.json();
  
	  if (data.error) {
		return res.status(401).json({ error: data.error_description });
	  }
  
	  return res.status(200).json({
		token: data.access_token,
		token_type: 'bearer',
	  });
	} catch (error) {
	  return res.status(500).json({ error: error.message });
	}
  };