
// Check if logged in
async function check_if_logged_in(req, res)
{
    try {
    	if(!req.session.login)
    	{
    	    res.redirect('/login');
    	    return false;
    	}
    	else
        {
    	    return true;
    	}  
    }
    catch(error) {
    	res.status(500).json({ error: 'Internal server error' });
    }  
}

