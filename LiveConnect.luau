local MessagingService = game:GetService("MessagingService")
local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")


local function Debug(message)
	print("[DEBUG] " .. message)
end

local function ParseISO8601Date(DateString)
	local Pattern = "(%d+)%-(%d+)%-(%d+)T(%d+):(%d+):(%d+)Z"
	local Year, Month, Day, Hour, Min, Sec = DateString:match(Pattern)
	if Year and Month and Day and Hour and Min and Sec then
		return os.time({
			year = tonumber(Year),
			month = tonumber(Month),
			day = tonumber(Day),
			hour = tonumber(Hour),
			min = tonumber(Min),
			sec = tonumber(Sec)
		})
	else
		return nil
	end
end

local function FormatDateToISO8601(Time)
	return os.date("!%Y-%m-%dT%H:%M:%SZ", Time)
end



local GetUrl = "" -- link do zahostowanego API
local ApiKey = "" -- klucz autoryzacyjny twojego API


local function CheckBan(Player)
	local url = GetUrl .. Player.Name
	local success, response = pcall(function()
		return HttpService:GetAsync(url, true, {
			["x-api-key"] = ApiKey
		})
	end)

	if not success then
		Debug("Error in HttpService:GetAsync: " .. tostring(response))
		return
	end

	if response then
		local data = HttpService:JSONDecode(response)
		if data and data.value then
			local BanInfo = HttpService:JSONDecode(data.value)
			Debug("Ban info found for player: " .. Player.Name)
			Debug(HttpService:JSONEncode(BanInfo))

			local CurrentDate = os.time()
			local EndDateTimestamp = ParseISO8601Date(BanInfo.date)

			Debug("Current Date: " .. tostring(CurrentDate))
			Debug("End Date Timestamp: " .. tostring(EndDateTimestamp))

			if CurrentDate < EndDateTimestamp then
				Player:Kick("Zostałeś tymczasowo zbanowany za: " .. BanInfo.reason .. " przez: " .. BanInfo.admin .. ". Ban wygasa: " .. FormatDateToISO8601(EndDateTimestamp))
			else
				Debug("Ban expired for player: " .. Player.Name)
			end
		else
			Debug("No ban info found for player: " .. Player.Name)
		end
	else
		Debug("Failed to retrieve ban info for player: " .. Player.Name .. " - Response: " .. tostring(response))
	end
end

MessagingService:SubscribeAsync("kick", function(Data)
	local Split = string.split(Data.Data, "::")
	local PlayerName = Split[1]
	local Reason = Split[2]
	local Admin = Split[3]

	if Players:FindFirstChild(PlayerName) then
		local Player = Players:FindFirstChild(PlayerName)
		Player:Kick("Zostałeś wyrzucony za: " .. Reason .. " przez: " .. Admin)
	end
end)

game.Players.PlayerAdded:Connect(function(Player)
	CheckBan(Player)
end)

while task.wait(20) do
	local players = Players:GetPlayers()
	for _, Player in ipairs(players) do
		CheckBan(Player)
	end
end
