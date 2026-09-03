(function () {
    var params = new URLSearchParams(window.location.search)
    var theme = params.get('theme')
    if (theme !== 'dark' && theme !== 'light') {
        var match = document.cookie.match(/(?:^|; )sessions-theme=([^;]*)/)
        theme = match ? decodeURIComponent(match[1]) : 'light'
    }
    document.cookie = 'sessions-theme=' + encodeURIComponent(theme) + '; path=/; max-age=31536000; SameSite=Lax'
    if (theme === 'dark') document.documentElement.classList.add('sessions-dark')

    function addBackButton() {
        if (document.getElementById('sessions-back-link')) return
        var target = document.querySelector('#kc-form, #kc-content, .pf-v5-c-login__main-body, .card-pf')
        if (!target) return
        var link = document.createElement('a')
        link.id = 'sessions-back-link'
        link.href = 'http://localhost:3002/'
        link.textContent = '← Back to Sessions'
        link.className = 'sessions-back-link'
        target.appendChild(link)
    }

    function moveSessionsBrand() {
        var oldBrand = document.querySelector('#kc-header, #kc-header-wrapper, .pf-v5-c-brand')
        var formCard = document.querySelector('.pf-v5-c-login__main, .card-pf')
        if (!formCard || document.getElementById('sessions-brand')) return
        var container = formCard.parentNode
        if (container) {
            container.style.display = 'flex'
            container.style.flexDirection = 'column'
            container.style.alignItems = 'center'
        }
        if (oldBrand) oldBrand.style.display = 'none'
        var brand = document.createElement('div')
        brand.id = 'sessions-brand'
        brand.textContent = 'SESSIONS'
        formCard.parentNode.insertBefore(brand, formCard)
    }

    function moveRequiredFields() {
        var card = document.querySelector('.pf-v5-c-login__main, .card-pf')
        if (!card) return
        var existing = card.querySelector('.sessions-required-fields')
        if (existing) {
            var back = card.querySelector('#sessions-back-link')
            if (back && existing.nextElementSibling !== back) card.insertBefore(existing, back)
            return
        }
        var elements = card.querySelectorAll('*')
        for (var i = 0; i < elements.length; i++) {
            var text = elements[i].textContent.trim()
            if (/\*?\s*(Required fields|Obavezna polja)/i.test(text) && elements[i].children.length === 0) {
                var required = elements[i].parentElement
                required.classList.add('sessions-required-fields')
                var backLink = card.querySelector('#sessions-back-link')
                if (backLink) card.insertBefore(required, backLink)
                else card.appendChild(required)
                break
            }
        }
    }

    function centerPageTitle() {
        var title = document.querySelector('#kc-page-title, .pf-v5-c-login__main-header h1, .login-pf-page .card-pf h1')
        if (!title) return
        title.style.width = '100%'
        title.style.marginLeft = 'auto'
        title.style.marginRight = 'auto'
        title.style.textAlign = 'center'
        var header = title.parentElement
        if (header) {
            header.style.width = '100%'
            header.style.textAlign = 'center'
        }
    }

    function finalizeLayout() {
        addBackButton()
        moveSessionsBrand()
        centerPageTitle()
        moveRequiredFields()
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finalizeLayout)
    else finalizeLayout()
    var layoutAttempts = 0
    var layoutTimer = window.setInterval(function () {
        finalizeLayout()
        layoutAttempts++
        if (layoutAttempts > 20) window.clearInterval(layoutTimer)
    }, 100)
}())
