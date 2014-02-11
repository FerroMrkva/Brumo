if (Test-Path Function:_OLD_VIRTUAL_PROMPT) {
	Set-Content Function:Prompt (Get-Content Function:_OLD_VIRTUAL_PROMPT);
}
rm function:_OLD_VIRTUAL_PROMPT

if (Test-Path Env:_OLD_VIRTUAL_PATH) {
	$Env:PATH = $Env:_OLD_VIRTUAL_PATH;
}
rm Env:_OLD_VIRTUAL_PATH

if (Test-Path Env:_OLD_PYTHONPATH) { 
	$Env:PYTHONPATH = $Env:_OLD_PYTHONPATH;
}
rm Env:PYTHONPATH
rm Env:CUDDLEFISH_ROOT
