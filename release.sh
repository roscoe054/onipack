dir="../avalon.oniui/"
uis=`ls $dir`
ver=$1""
if [ $ver"x" == "x" ];then
	ver="0.0.1"
fi

for ui in $uis;do
	if [ -d $dir"$ui" ];then
		cp "$dir"avalon.getModel.js store/oni/
		ndir=store/oni/$ui/
		if [ -d $ndir ];then
			la=2
		else
			mkdir $ndir
		fi
		ndir=store/oni/$ui/$ver
		rm -rf $ndir
		mkdir $ndir
		if [ $ui == "chameleon" ];then
			cp $dir"$ui"/*.css $ndir -r
		else
			# cp $dir"$ui"/*.js $ndir #js
			# cp $dir"$ui"/*.png $ndir #img
			# cp $dir"$ui"/*.gif $ndir
			# cp $dir"$ui"/*.jpg $ndir
			# cp $dir"$ui"/*.jpeg $ndir
			# cp $dir"$ui"/avalon.$ui.css $ndir #css
			#template
			files=`ls $dir"$ui"/*`
			for file in $files;do
				f=${file/.ex/}
				f=${f/.doc/}
				f=${f/.case/}
				f=${f/.test/}
				f=${f/.scss/}
				if [ $f == $file ] && [ -f $file ];then
					cp $f $ndir
				elif [ -d $file ];then
					mkdir $ndir/$f
					cp -rf $f/* $ndir/$f/ 
				fi
			done
		fi
	fi
done

node main.js release oni