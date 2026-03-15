function SessionConfigFallback() as Object
    return {
        server: XtreamApiDefaultBaseUrl()
        username: "etvroku"
        password: "etvroku"
    }
end function

function SessionConfigResolve(provisionedSession as Dynamic) as Object
    if provisionedSession <> invalid then
        return provisionedSession
    end if
    return SessionConfigFallback()
end function
