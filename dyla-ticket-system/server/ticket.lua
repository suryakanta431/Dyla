local tickets_key = KEYS[1]
local current = tonumber(redis.call('get', tickets_key) or "0")
if current > 0 then
    redis.call('decr', tickets_key)
    return 1
else
    return 0
end