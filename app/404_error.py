@app.errorhandler(404)
def page_not_found(error):
    return 'Oops! Page not found.', 404