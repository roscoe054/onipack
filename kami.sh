dir="../kami/"
uis=`ls $dir`
ver=$1""
if [ $ver"x" == "x" ];then
	ver="0.0.1"
fi

for ui in $uis;do
	if [ -d $dir"$ui" ];then
		if [ -d store/kami/$ui ];then
			f2=""
		else
			mkdir store/kami/$ui
		fi
		if [ -d  ];then
			f2=""
		else
			mkdir store/kami/$ui/$ver
		fi
		cp $dir"$ui" store/kami/$ui/$ver -rf
	fi
done

node main.js release kami